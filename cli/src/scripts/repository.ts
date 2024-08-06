import {
  GithubService,
  Issue,
  Release,
  Repository,
  RepositoryResource,
  Stargazer,
  StorageService,
  Tag,
  Watcher
} from '@/core/index.js';
import githubClient from '@/helpers/github-client.js';
import { knex } from '@/knex/knex.js';
import { RelationalStorage } from '@/knex/storage.js';
import client from '@/mongo/client.js';
import { MultiBar, SingleBar } from 'cli-progress';
import { Argument, Option, program } from 'commander';
import consola from 'consola';
import PQueue from 'p-queue';
import pluralize from 'pluralize';
import { Class } from 'type-fest';
import { AbstractTask } from '../helpers/task.js';

type Notification<T extends RepositoryResource = RepositoryResource> = { repository: string } & (
  | { resource?: undefined; data: Repository }
  | { resource: Class<T>; data: T[]; done: false }
  | { resource: Class<T>; done: true }
);

const RESOURCE_LIST = [Tag, Release, Stargazer, Watcher, Issue];

/**
 * Task to retrieve all resources from a repository.
 */
export class RepositoryUpdater extends AbstractTask<Notification> {
  private idOrName: string | number;

  private service: StorageService;
  private resources: Class<Tag | Release | Stargazer | Watcher | Issue>[];
  private queue: PQueue;

  constructor(
    idOrName: string | number,
    params: {
      service: StorageService;
      resources?: Class<Tag | Release | Stargazer | Watcher | Issue>[];
      parallel?: boolean;
    }
  ) {
    super();
    this.idOrName = idOrName;
    this.service = params.service;
    this.resources = params.resources || RESOURCE_LIST;
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

      await Promise.allSettled(
        this.resources.map(async (Ref) =>
          this.queue.add(async () => {
            const it = this.service.resource(Ref as any, { repo, per_page: Ref === Issue ? 25 : 100 });

            for await (const response of it) {
              this.notify({ repository: repo.node_id, resource: Ref, data: response.data, done: false });
            }

            this.notify({ repository: repo.node_id, resource: Ref, done: true });
          })
        )
      ).then((results) => {
        const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
        if (errors.length) throw new AggregateError(errors, 'Some resources failed to update!');
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
    .name('search')
    .addArgument(new Argument('<full_name>', 'Repository to update'))
    .addOption(
      new Option('-r, --resources <resources...>', 'Resources to update')
        .choices([...RESOURCE_LIST.map((r) => pluralize(r.name.toLowerCase())), 'all'])
        .default(['all'])
    )
    .addOption(new Option('-p, --parallel', 'Run in parallel').default(false))
    .helpOption('-h, --help', 'Display this help message')
    .action(async (fullName: string, opts: { resources: string[]; parallel: boolean }) => {
      if (fullName.split('/').length !== 2) throw new Error('Invalid repository name! Use the format owner/name.');

      const resources = opts.resources.includes('all')
        ? RESOURCE_LIST
        : opts.resources
            .map((r) => RESOURCE_LIST.find((res) => pluralize(res.name.toLowerCase()) === r))
            .filter((r) => r !== undefined);

      consola.info('Initializing the Github service...');
      const service = new StorageService(new GithubService(githubClient), new RelationalStorage(knex), {
        valid_by: 1
      });

      consola.info('Starting the repository update...');
      const progress = new MultiBar({
        format: ' {bar} | {resource} | {value}/{total} ({percentage}%) | {duration_formatted}',
        hideCursor: true
      });

      const bars: Record<string, SingleBar> = {
        repo: progress.create(1, 0, { resource: 'repository'.padEnd(12) }),
        ...resources.reduce((mem: Record<string, SingleBar>, res) => {
          const name = pluralize(res.prototype._entityname);
          return { ...mem, [name]: progress.create(0, 0, { resource: name.padEnd(12) }) };
        }, {})
      };

      const task = new RepositoryUpdater(fullName, { service, resources, parallel: true });

      task.subscribe({
        next: (notification) => {
          if (!notification.resource) {
            const { repo, ...others } = bars;
            repo.increment(1);
            repo.stop();
            Object.keys(others).forEach((key) => {
              if (!notification.data._summary) return;
              const summary: Record<string, number> = {
                ...notification.data._summary,
                issues: notification.data._summary.issues + notification.data._summary.pull_requests
              };
              others[key].setTotal(summary[key]);
            });
          } else {
            const name = pluralize(notification.resource.prototype._entityname);
            if (notification.done) bars[name].stop();
            else bars[name].increment(notification.data.length);
          }
        }
      });

      await task
        .execute()
        .then(() => {
          consola.success('Done!');
          return Promise.all([client.close(), progress.stop()]);
        })
        .catch((err) => {
          consola.error(err);
          process.exit(1);
        });
    })
    .parseAsync(process.argv);
}
