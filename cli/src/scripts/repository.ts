import { RepositoryNode } from '@/core/entities/base/RepositoryNode.js';
import { Actor, GithubService, Repository, StorageService } from '@/core/index.js';
import { createCache } from '@/helpers/cache.js';
import githubClient from '@/helpers/github.js';
import mongo from '@/mongo/mongo.js';
import { MongoStorageFactory } from '@/mongo/MongoStorage.js';
import { CacheService } from '@/services/CacheService.js';
import { MultiBar, SingleBar } from 'cli-progress';
import { Argument, Option, program } from 'commander';
import consola from 'consola';
import camelCase from 'lodash/camelCase.js';
import upperFirst from 'lodash/upperFirst.js';
import PQueue from 'p-queue';
import pluralize from 'pluralize';
import { ArrayValues, ObservableLike, Observer, Unsubscribable } from 'type-fest';

/**
 * Task interface.
 */
export interface Task<T = unknown> extends ObservableLike<T> {
  state: 'pending' | 'running' | 'completed' | 'error';
  execute(): Promise<void>;
}

/**
 * Abstract class for tasks.
 */
export abstract class AbstractTask<T = unknown> implements Task<T> {
  state: 'pending' | 'running' | 'completed' | 'error' = 'pending';

  private observers: (Partial<Observer<T>> | undefined)[] = [];

  subscribe(observer: Partial<Observer<T>>): Unsubscribable {
    const index = this.observers.push(observer) - 1;
    return { unsubscribe: () => (this.observers[index] = undefined) };
  }

  protected notify(data: T | Error): void {
    if (typeof data === 'number') {
      if (data === 1) this.complete();
      this.observers.forEach((observer) => observer?.next?.(data));
    } else if (data instanceof Error) {
      this.observers.forEach((observer) => observer?.error?.(data));
    } else {
      this.observers.forEach((observer) => observer?.next?.(data));
    }
  }

  protected complete(): void {
    this.observers.forEach((observer) => observer?.complete?.());
  }

  [Symbol.observable](): ObservableLike<T> {
    return this;
  }

  abstract execute(): Promise<void>;
}

const UpdatableResources = [
  'tags',
  'releases',
  'stargazers',
  'watchers',
  'issues',
  'pull_requests',
  'commits',
  'users',
  'discussions'
] as const;

type UpdatableResource = ArrayValues<typeof UpdatableResources>;

type Notification = { repository: string } & (
  | { resource?: undefined; data: Repository }
  | { resource: UpdatableResource; data: RepositoryNode[] | Actor[]; total?: number; done: false }
  | { resource: UpdatableResource; done: true }
);

/**
 * Task to retrieve all resources from a repository.
 */
export class RepositoryUpdater extends AbstractTask<Notification> {
  public static readonly resources: UpdatableResource[] = [...UpdatableResources];

  private idOrName: string;

  private service: StorageService;
  private resources: UpdatableResource[];
  private queue: PQueue;

  constructor(
    idOrName: string,
    params: { service: StorageService; resources?: UpdatableResource[]; parallel?: boolean }
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

      this.notify({ repository: repo.id, data: repo });

      const promises = this.resources.map(async (name) =>
        this.queue
          .add(async () => {
            if (name === 'users') {
              const storage = this.service.storage.create('Actor');

              let users: Actor[] = [];

              const [notUpdated, all] = await Promise.all([
                storage.count({ updated_at: undefined }),
                storage.count({})
              ]);

              let total = all - notUpdated;

              do {
                users = await storage.find({ updated_at: undefined, _deleted_at: undefined } as any, { limit: 100 });

                if (users.length > 0) {
                  const updatedUsers = (await this.service.user(users.map((u) => u.id)))
                    .filter((u) => u !== null)
                    .filter((u) => u.updated_at);

                  // workaround to mark users as deleted when not found with the same id
                  await Promise.all(
                    users
                      .filter((u) => !updatedUsers.find((uu) => uu.id === u.id))
                      .map((u) => storage.save({ ...u, _deleted_at: new Date() } as any, true))
                  );

                  this.notify({
                    repository: repo.id,
                    resource: 'users',
                    data: updatedUsers,
                    total: (total += updatedUsers.length),
                    done: false
                  });
                } else if (this.queue.pending > 1) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              } while (users.length > 0 || this.queue.pending > 1);

              this.notify({ repository: repo.id, resource: 'users', done: true });
            } else {
              let first = 100;
              if (name === 'issues') first = 25;
              if (name === 'pull_requests') first = 15;

              const it = this.service.resource(name as any, { repository: repo.id, first, resume: true });

              let total = await this.service.storage
                .create<RepositoryNode>(upperFirst(camelCase(pluralize.singular(name))))
                .count({ repository: repo.id });

              for await (const response of it) {
                this.notify({
                  repository: repo.id,
                  resource: name,
                  data: response.data,
                  total: (total += response.data.length),
                  done: false
                });
              }

              this.notify({ repository: repo.id, resource: name, done: true });
            }
          })
          .catch((err) => {
            this.notify(err);
            throw err;
          })
      );

      if (this.queue.concurrency > 1) {
        await Promise.allSettled(promises).then((results) => {
          const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
          if (errors.length) throw new AggregateError(errors, errors.map((e) => e.message).join(' -- '));
        });
      } else {
        await Promise.all(promises);
      }

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
        .choices(RepositoryUpdater.resources)
        .default(RepositoryUpdater.resources)
    )
    .addOption(new Option('-p, --parallel', 'Run in parallel').default(false))
    .helpOption('-h, --help', 'Display this help message')
    .action(async (nameWithOwner: string, opts: { resource: string[]; parallel: boolean }) => {
      const resources = opts.resource
        .map((r) => RepositoryUpdater.resources.find((R) => R === r))
        .filter((r) => r !== undefined);

      if (nameWithOwner.split('/').length !== 2) throw new Error('Invalid repository name! Use the format owner/name.');

      consola.info('Initializing the Github service...');
      const storageFactory = new MongoStorageFactory(
        mongo.db(
          nameWithOwner
            .replace('/', '@')
            .replace(/[^a-zA-Z0-9@_]/g, '_')
            .toLowerCase()
        )
      );

      const replicaService = new StorageService(
        new CacheService(new GithubService(githubClient), await createCache()),
        storageFactory
      );

      consola.info('Starting the repository update...');
      const progress = new MultiBar({
        format: ' {bar} | {resource} | {value}/{total} ({percentage}%) | {duration_formatted}',
        hideCursor: true
      });

      const bars: Record<string, SingleBar> = {
        repo: progress.create(1, 0, { resource: 'repository'.padEnd(12) }),
        ...resources.reduce((mem: Record<string, SingleBar>, Ref) => {
          return { ...mem, [Ref]: progress.create(0, 0, { resource: Ref.padEnd(12) }) };
        }, {})
      };

      const interval = setInterval(async () => {
        if (!resources.includes('users')) return;

        return storageFactory
          .create('Actor')
          .count({})
          .then((total) => bars.users.setTotal(total));
      }, 1000 * 15);

      const task = new RepositoryUpdater(nameWithOwner, {
        service: replicaService,
        resources,
        parallel: opts.parallel
      });

      task.subscribe({
        next: (notification) => {
          if (!notification.resource) {
            const { repo, ...others } = bars;
            repo.increment(1);
            repo.stop();
            Object.keys(others).forEach((key) => {
              if (key === 'users') return;
              others[key].setTotal((notification.data as Record<string, any>)[`${key}_count`] || 0);
            });
          } else {
            if (notification.done) bars[notification.resource].stop();
            else if (notification.total) bars[notification.resource].update(notification.total);
            else bars[notification.resource].increment(notification.data.length);
          }
        }
      });

      await task
        .execute()
        .then(() => {
          consola.success('Done!');
          return Promise.all([mongo.close(), progress.stop(), clearInterval(interval)]);
        })
        .catch((err) => {
          consola.error(err);
          process.exit(1);
        })
        .finally(() => process.exit(0));
    })
    .parseAsync(process.argv);
}
