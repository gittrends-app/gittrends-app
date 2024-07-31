import { GithubClient, GithubService, Repository, StorageService, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import migrate from '@/mongo/migrate.js';
import { MongoStorage } from '@/mongo/storage.js';
import { SingleBar } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import { AbstractTask } from '../helpers/task.js';
import { UserUpdater } from './update/user.js';

/**
 *  Task to add repositories to the database.
 */
export class AddRepositories extends AbstractTask<{ repositories: Repository[] }> {
  constructor(
    private total: number,
    private params: { service: StorageService; language?: string }
  ) {
    super();
  }

  async execute(): Promise<void> {
    if (this.state === 'running') throw new Error('Task already running!');

    try {
      this.state = 'running';

      for await (const res of this.params.service.search(this.total, { language: this.params.language })) {
        this.notify({ repositories: res.data });
      }

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      this.notify(error instanceof Error ? error : new Error(JSON.stringify(error)));
      throw error;
    }
  }
}

/**
 * CLI script to search for repositories.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('search')
    .addOption(
      new Option('-t, --total <total>', 'Total number of repositories to search')
        .makeOptionMandatory()
        .argParser(Number)
    )
    .helpOption('-h, --help', 'Display this help message')
    .action(async (options: { total: number }) => {
      const db = client.db(env.MONGO_DB);

      consola.info('Initializing the storage service...');
      const service = new StorageService(
        new GithubService(new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN })),
        new MongoStorage(db),
        { valid_by: 1 }
      );

      consola.info('Connecting to the database...');
      await client.connect();

      consola.info('Running migrations...');
      await migrate.up(db, client);

      const task = new AddRepositories(options.total, { service });

      const progress = new SingleBar({
        format: '{task}: [{bar}] {percentage}% | {duration_formatted} | {value}/{total}',
        stopOnComplete: true,
        clearOnComplete: true,
        hideCursor: true
      });

      const tasks: UserUpdater[] = [];

      task.subscribe({
        next: (data) => {
          progress.increment(data.repositories.length);

          tasks.push(
            ...data.repositories
              .map((repo) => [(repo.owner as User | undefined)?.id, (repo.organization as User | undefined)?.id])
              .flat()
              .filter((id) => id !== undefined)
              .map((id) => new UserUpdater(id, { service }))
          );
        }
      });

      consola.info('Starting the search...');
      progress.start(options.total, 0, { task: 'searching' });

      await task
        .execute()
        .then(() => {
          progress.start(tasks.length, 0, { task: 'updating' });
          return Promise.all(tasks.map((task) => task.execute().then(() => progress.increment(1))));
        })
        .then(() => {
          consola.success('Search completed!');
          return Promise.all([client.close(), progress.stop()]);
        })
        .catch((err) => {
          consola.error('Search failed!', err);
          process.exit(1);
        });
    })
    .parse(process.argv);
}
