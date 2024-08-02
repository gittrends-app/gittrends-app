import { GithubClient, GithubService, Repository, StorageService, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import { MongoStorage } from '@/mongo/storage.js';
import { Worker } from 'bullmq';
import { MultiBar, Presets } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import { createQueue, createWorker } from './queue/queues.js';
import { RepositoryUpdater } from './repository.js';
import { UserUpdater } from './user.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('update')
    .addOption(new Option('-rc <number>', 'Number of concurrent workers for repositories').argParser(Number).default(1))
    .addOption(new Option('-uc <number>', 'Number of concurrent workers for users').argParser(Number).default(1))
    .helpOption('-h, --help', 'Display help for command')
    .action(async (opts: { Rc: number; Uc: number }) => {
      consola.info('Connecting to the database...');
      await client.connect();

      consola.info('Initializing the storage service...');
      const service = new StorageService(
        new GithubService(
          new GithubClient(env.GITHUB_API_BASE_URL, {
            apiToken: env.GITHUB_API_TOKEN,
            disableThrottling: env.GITHUB_DISABLE_THROTTLING
          })
        ),
        new MongoStorage(client.db(env.MONGO_DB)),
        { valid_by: 1 }
      );

      const progress = new MultiBar(
        {
          format: `{name} | {bar} | {percentage}% | {value}/{total}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        },
        Presets.shades_classic
      );

      const worker = usersUpdate(service, opts.Uc, progress);
      const repoWorker = reposUpdate(service, opts.Rc, progress);

      await Promise.all([
        new Promise<void>((resolve) => {
          worker.on('closed', async () => resolve());
        }),
        new Promise<void>((resolve) => {
          repoWorker.on('closed', async () => resolve());
        })
      ]);

      consola.success('Update process finished!');
    })
    .parseAsync(process.argv)
    .catch((error) => {
      consola.error(error);
      process.exit(1);
    })
    .finally(() => client.close())
    .finally(() => process.exit(0));
}

/**
 *
 */
function usersUpdate(service: StorageService, concurrency: number, progress: MultiBar): Worker {
  const queue = createQueue(User);

  const bar = progress.create(Infinity, 0, { name: '> users' });

  setInterval(async () => {
    const count = await queue
      .getJobCounts()
      .then((totals) => Object.values(totals).reduce((acc, total) => acc + total, 0));

    bar.start(count, count - (await queue.count()), { name: '> users' });
  }, 5000);

  const worker = createWorker(
    User,
    async (job) => {
      return new UserUpdater(job.data.id, { service })
        .execute()
        .then(() => bar.increment())
        .then(() => job.updateProgress(100));
    },
    concurrency
  );

  worker.on('closed', () => progress.remove(bar));

  return worker;
}

/**
 *
 */
function reposUpdate(service: StorageService, concurrency: number, progress: MultiBar): Worker {
  const queue = createQueue(Repository);

  const queueBar = progress.create(Infinity, 0, { name: '> repos' });

  setInterval(async () => {
    const count = await queue
      .getJobCounts()
      .then((totals) => Object.values(totals).reduce((acc, total) => acc + total, 0));

    queueBar.start(count, count - (await queue.count()) - (await queue.getActiveCount()), { name: '> repos' });
  }, 5000);

  return createWorker(
    Repository,
    async (job) => {
      const task = new RepositoryUpdater(job.data.full_name, { service, parallel: true });

      const repoBar = progress.create(
        0,
        0,
        { repo: job.data.full_name },
        { format: `        | {bar} | {percentage}% | {value}/{total} | {repo}` }
      );

      task.subscribe({
        next: (notification) => {
          if (!notification.resource) {
            repoBar.increment(1);
            repoBar.setTotal(Object.values(notification.data._summary || {}).reduce((acc, total) => acc + total, 1));
          } else {
            if (!notification.done) {
              repoBar.increment(notification.data.length);
              job.updateProgress(repoBar.getProgress() * 100);
            }
          }
        },
        complete: () => {
          repoBar.stop();
          progress.remove(repoBar);
        }
      });

      return task
        .execute()
        .then(() => job.updateProgress(100))
        .then(() => queueBar.increment())
        .finally(() => queueBar.stop())
        .finally(() => progress.remove(queueBar));
    },
    concurrency
  );
}
