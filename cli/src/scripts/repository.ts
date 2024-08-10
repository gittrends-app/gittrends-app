import {
  GithubService,
  Issue,
  Release,
  Repository,
  RepositoryResource,
  Stargazer,
  StorageService,
  Tag,
  User,
  Watcher
} from '@/core/index.js';
import env from '@/helpers/env.js';
import githubClient from '@/helpers/github.js';
import { connect } from '@/knex/knex.js';
import { RelationalStorage } from '@/knex/storage.js';
import { CacheService } from '@/services/cache.js';
import { caching } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { MultiBar, SingleBar } from 'cli-progress';
import { Argument, Option, program } from 'commander';
import consola from 'consola';
import snakeCase from 'lodash/snakeCase.js';
import PQueue from 'p-queue';
import pluralize from 'pluralize';
import { RedisClientOptions } from 'redis';
import { Class } from 'type-fest';
import { AbstractTask } from '../helpers/task.js';

type Updatable = Class<RepositoryResource | User>;

type Notification<T extends RepositoryResource | User = any> = { repository: string } & (
  | { resource?: undefined; data: Repository }
  | { resource: Class<T>; data: T[]; done: false }
  | { resource: Class<T>; done: true }
);

/**
 * Task to retrieve all resources from a repository.
 */
export class RepositoryUpdater extends AbstractTask<Notification> {
  public static readonly resources: Updatable[] = [Tag, Release, Stargazer, Watcher, Issue, User];

  private idOrName: string | number;

  private service: StorageService;
  private resources: Updatable[];
  private queue: PQueue;

  constructor(
    idOrName: string | number,
    params: { service: StorageService; resources?: Updatable[]; parallel?: boolean }
  ) {
    super();
    this.idOrName = idOrName;
    this.service = params.service;
    this.resources = params.resources || RepositoryUpdater.resources;
    this.queue = new PQueue({ concurrency: params.parallel ? this.resources.length : 1 });
  }

  async execute(): Promise<void> {
    if (this.state === 'running') throw new Error('Task already running!');

    try {
      this.state = 'running';

      const [owner, name] = this.idOrName.toString().split('/');

      const repo = await this.service.repository(owner, name);
      if (!repo) throw new Error('Repository not found!');

      this.notify({ repository: repo._id, data: repo });

      const promises = this.resources.map(async (Ref) =>
        this.queue
          .add(async () => {
            if (Ref === User) {
              const storage = this.service.storage.create(User);

              let users: User[] = [];

              do {
                users = await storage.find({ updated_at: undefined });

                if (users.length > 0) {
                  const updatedUsers = await this.service.user(users.map((u) => u.id));
                  this.notify({
                    repository: repo._id,
                    resource: User,
                    data: updatedUsers.filter((u) => u !== null),
                    done: false
                  });
                } else if (this.queue.pending > 1) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              } while (users.length > 0 || this.queue.pending > 1);

              this.notify({ repository: repo._id, resource: User, done: true });
            } else {
              const it = this.service.resource(Ref as any, { repo, per_page: Ref === Issue ? 25 : 100 });

              for await (const response of it) {
                this.notify({ repository: repo.node_id, resource: Ref, data: response.data, done: false });
              }

              this.notify({ repository: repo.node_id, resource: Ref, done: true });
            }
          })
          .catch((err) => {
            this.notify(err);
            throw err;
          })
      );

      await Promise.allSettled(promises).then((results) => {
        const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
        if (errors.length) throw new AggregateError(errors, errors.map((e) => e.message).join(' -- '));
      });

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      this.notify(error instanceof Error ? error : new Error(JSON.stringify(error)));
      throw error;
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('repo')
    .addArgument(new Argument('<full_name>', 'Repository to update'))
    .addOption(
      new Option('-r, --resource <resource...>', 'Resource to update')
        .choices(RepositoryUpdater.resources.map((r) => r.name))
        .default(RepositoryUpdater.resources.map((r) => r.name))
    )
    .addOption(new Option('-p, --parallel', 'Run in parallel').default(false))
    .helpOption('-h, --help', 'Display this help message')
    .action(async (fullName: string, opts: { resource: string[]; parallel: boolean }) => {
      const resources = opts.resource
        .map((r) => RepositoryUpdater.resources.find((R) => R.name === r))
        .filter((r) => r !== undefined);

      if (fullName.split('/').length !== 2) throw new Error('Invalid repository name! Use the format owner/name.');

      consola.info('Connecting to the database...');
      const db = await connect(env.DATABASE_URL, {
        schema: fullName.replace('/', '@').replace(/[^a-zA-Z0-9_]/g, '_'),
        migrate: true
      });

      consola.info('Initializing cache...');
      const cache = await caching(redisStore, {
        ttl: 1000 * 60 * 60 * 24 * 7,
        max: 100000,
        url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_CACHE_DB}`,
        database: env.REDIS_CACHE_DB
      } satisfies RedisClientOptions & Record<string, any>);

      consola.info('Initializing the Github service...');
      const replicaService = new StorageService(
        new CacheService(new GithubService(githubClient), cache),
        new RelationalStorage(db),
        { valid_by: 1 }
      );

      consola.info('Starting the repository update...');
      const progress = new MultiBar({
        format: ' {bar} | {resource} | {value}/{total} ({percentage}%) | {duration_formatted}',
        hideCursor: true
      });

      const bars: Record<string, SingleBar> = {
        repo: progress.create(1, 0, { resource: 'repository'.padEnd(12) }),
        ...resources.reduce((mem: Record<string, SingleBar>, Ref) => {
          const name = pluralize(snakeCase(Ref.name));
          return { ...mem, [name]: progress.create(0, 0, { resource: name.padEnd(12) }) };
        }, {})
      };

      const interval = setInterval(async () => {
        const [total, updated] = await Promise.all([
          db(pluralize(snakeCase(User.name)))
            .count({ count: '*' })
            .then(([res]) => res.count as number),
          db(pluralize(snakeCase(User.name)))
            .whereNotNull('updated_at')
            .count({ count: '*' })
            .then(([res]) => res.count as number)
        ]);

        bars.users.setTotal(total);
        bars.users.update(updated);
      }, 1000 * 15);

      const task = new RepositoryUpdater(fullName, { service: replicaService, resources, parallel: true });

      task.subscribe({
        next: (notification) => {
          if (!notification.resource) {
            const { repo, ...others } = bars;
            repo.increment(1);
            repo.stop();
            Object.keys(others).forEach((key) => {
              if (key === 'users' || !notification.data._resources_counts) return;
              const summary: Record<string, number> = {
                ...notification.data._resources_counts,
                issues: notification.data._resources_counts.issues + notification.data._resources_counts.pull_requests
              };
              others[key].setTotal(summary[key]);
            });
          } else {
            const name = pluralize(snakeCase(notification.resource.name));
            if (notification.done) bars[name].stop();
            else bars[name].increment(notification.data.length);
          }
        }
      });

      await task
        .execute()
        .then(() => {
          consola.success('Done!');
          return Promise.all([db.destroy(), progress.stop(), clearInterval(interval)]);
        })
        .catch((err) => {
          consola.error(err);
          process.exit(1);
        })
        .finally(() => process.exit(0));
    })
    .parseAsync(process.argv);
}
