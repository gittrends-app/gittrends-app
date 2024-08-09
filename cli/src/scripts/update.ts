import { GithubService, Repository, Service, StorageService } from '@/core/index.js';
import env from '@/helpers/env.js';
import githubClient from '@/helpers/github.js';
import { connect } from '@/knex/knex.js';
import { RelationalStorage } from '@/knex/storage.js';
import { CacheService } from '@/services/cache.js';
import { Worker } from 'bullmq';
import { caching } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { MultiBar, Presets } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import readline from 'readline';
import { RedisClientOptions } from 'redis';
import { createQueue, createWorker } from './queue/queues.js';
import { RepositoryUpdater } from './repository.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('update')
    .addOption(new Option('-w, --workers <number>', 'Number of concurrent workers').argParser(Number).default(1))
    .helpOption('-h, --help', 'Display help for command')
    .action(async (opts: { workers: number }) => {
      readline.emitKeypressEvents(process.stdin);
      process.stdin.setRawMode(true);

      const cache = await caching(redisStore, {
        ttl: 1000 * 60 * 60 * 24 * 7,
        max: 100000,
        url: `redis://${env.REDIS_HOST}:${env.REDIS_PORT}/${env.REDIS_CACHE_DB}`,
        database: env.REDIS_CACHE_DB
      } satisfies RedisClientOptions & Record<string, any>);

      consola.info('Initializing the storage service...');
      const service = new CacheService(new GithubService(githubClient), cache);

      const progress = new MultiBar(
        {
          format: `{name} | {bar} | {percentage}% | {value}/{total}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        },
        Presets.shades_classic
      );

      const worker = reposUpdate(service, opts.workers, progress);

      process.stdin.on('keypress', async (str, key) => {
        if (key.sequence === '+') {
          worker.concurrency = ++opts.workers;
        } else if (key.sequence === '-') {
          worker.concurrency = Math.max(1, --opts.workers);
        } else if (key.ctrl && key.name === 'c') {
          process.exit();
        }
      });

      await new Promise<void>((resolve) => {
        worker.on('closed', async () => resolve());
      });

      consola.success('Update process finished!');
    })
    .parseAsync(process.argv)
    .catch((error) => {
      consola.error(error);
      process.exit(1);
    })
    .finally(() => process.exit(0));
}

/**
 *
 */
function reposUpdate(service: Service, concurrency: number, progress: MultiBar): Worker {
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
      const knex = await connect(env.DATABASE_URL, {
        schema: job.data.full_name.replace('/', '@').replace(/[^a-zA-Z0-9_]/g, '_'),
        migrate: true
      });

      const task = new RepositoryUpdater(job.data.full_name, {
        service: new StorageService(service, new RelationalStorage(knex), { valid_by: 1 }),
        parallel: true
      });

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
            repoBar.setTotal(
              Object.values(notification.data._resources_counts || {}).reduce((acc, total) => acc + total, 1)
            );
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
        .finally(() => progress.remove(queueBar))
        .finally(() => knex.destroy());
    },
    concurrency
  );
}
