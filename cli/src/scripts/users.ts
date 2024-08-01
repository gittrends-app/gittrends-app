import { GithubClient, GithubService, StorageService, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import { MongoStorage } from '@/mongo/storage.js';
import { queue } from 'async';
import { Presets, SingleBar } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import pluralize from 'pluralize';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('users-update')
    .addOption(new Option('-c, --concurrency <number>', 'Number of concurrent requests').argParser(Number).default(1))
    .helpOption('-h, --help', 'Display help for command')
    .action(async (opts: { concurrency: number }) => {
      consola.info('Connecting to the database...');
      await client.connect();
      const db = client.db(env.MONGO_DB);

      consola.info('Initializing the storage service...');
      const service = new StorageService(
        new GithubService(new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN })),
        new MongoStorage(db),
        { valid_by: 1 }
      );

      consola.info('Counting users to update...');
      const count = await db
        .collection(pluralize(User.prototype._entityname))
        .countDocuments({ created_at: { $exists: false } });

      const tasks = queue(async (id: number) => service.user(id), opts.concurrency);

      const it = db.collection(pluralize(User.prototype._entityname)).find({ created_at: { $exists: false } });

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

      bar.start(count, 0);
      while (await it.hasNext()) {
        const user = await it.next();
        if (!user) break;
        tasks.push(user.id).then(() => bar.increment());
        await tasks.unsaturated();
      }
      bar.stop();

      consola.success('Users updated successfully!');
    })
    .parseAsync(process.argv)
    .finally(() => client.close());
}
