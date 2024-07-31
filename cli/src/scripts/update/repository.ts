import {
  GithubClient,
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
import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import { MongoStorage } from '@/mongo/storage.js';
import { QueueObject, queue } from 'async';
import { Presets, SingleBar } from 'cli-progress';
import { Argument, Option, program } from 'commander';
import consola from 'consola';
import pluralize from 'pluralize';
import { Class } from 'type-fest';
import { AbstractTask } from '../../helpers/task.js';

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
  private queue: QueueObject<Parameters<StorageService['resource']>>;

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

    this.queue = queue(
      async ([res, opts]: Parameters<StorageService['resource']>) => {
        for await (const response of this.service.resource(res, opts)) {
          this.notify({ repository: opts.repo.node_id, resource: res, data: response.data, done: false });
        }
        this.notify({ repository: opts.repo.node_id, resource: res, done: true });
      },
      params.parallel ? params.resources?.length || 5 : 1
    );
  }

  async execute(): Promise<void> {
    if (this.state === 'running') throw new Error('Task already running!');

    try {
      this.state = 'running';

      const [owner, name] = this.idOrName.toString().split('/');

      const repo = await this.service.repository(owner, name);
      if (!repo) throw new Error('Repository not found!');

      this.notify({ repository: repo._id, data: repo });

      await Promise.all(
        this.resources.map((resource) =>
          this.queue.pushAsync([[resource as any, { repo, per_page: resource === Issue ? 25 : 100 }]])
        )
      );
      await this.queue.drain();

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
      const service = new StorageService(
        new GithubService(new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN })),
        new MongoStorage(client.db(env.MONGO_DB)),
        { valid_by: 1 }
      );

      consola.info('Starting the repository update...');
      const progress = new SingleBar(
        {
          format: ' {bar} {percentage}% | {duration_formatted} | {message}',
          clearOnComplete: true,
          stopOnComplete: true,
          hideCursor: true
        },
        Presets.shades_grey
      );

      progress.start(resources.length + 1, 0, { message: '...' });

      const task = new RepositoryUpdater(fullName, { service, resources, parallel: true });

      const count: Record<string, number> = {};

      task.subscribe({
        next: (notification) => {
          if (!notification.resource) {
            progress.increment(1, { message: 'repository update' });
          } else {
            const name = notification.resource.prototype._entityname;
            if (!notification.done) count[name] = (count[name] || 0) + (notification.data.length || 0);
            progress.increment(notification.done ? 1 : 0, {
              message: `${count[name]} ${pluralize(name)} (${notification.done ? 'finished' : 'in progress'})`
            });
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
