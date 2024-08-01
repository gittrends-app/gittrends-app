import { GithubClient, GithubService, StorageService, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import { MongoStorage } from '@/mongo/storage.js';
import { Presets, SingleBar } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import { createQueue, createWorker } from './queue/queues.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('users-update')
    .addOption(new Option('-c, --concurrency <number>', 'Number of concurrent requests').argParser(Number).default(1))
    .helpOption('-h, --help', 'Display help for command')
    .action(async (opts: { concurrency: number }) => {
      consola.info('Connecting to the database...');
      await client.connect();

      consola.info('Initializing the storage service...');
      const service = new StorageService(
        new GithubService(new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN })),
        new MongoStorage(client.db(env.MONGO_DB)),
        { valid_by: 1 }
      );

      consola.info('Counting users to update...');

      const queue = createQueue(User);

      consola.info('Updating users...');
      const bar = new SingleBar(
        {
          format: `Updating users | {bar} | {percentage}% | {value}/{total}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        },
        Presets.shades_classic
      );

      bar.start(Infinity, 0);

      setInterval(async () => {
        const count = await queue
          .getJobCounts()
          .then((totals) => Object.values(totals).reduce((acc, total) => acc + total, 0));

        bar.start(count, count - (await queue.count()));
      }, 5000);

      const worker = createWorker(
        User,
        async (job) => {
          return service
            .user(job.data.id)
            .then(() => bar.increment())
            .then(() => job.updateProgress(100));
        },
        opts.concurrency
      );

      await new Promise<void>((resolve) => {
        worker.on('drained', async () => resolve());
      });

      consola.success('Users updated successfully!');
    })
    .parseAsync(process.argv)
    .finally(() => client.close());
}
