import { GithubService, Issue, Repository, Service, StorageService, User } from '@/core/index.js';
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
import snakeCase from 'lodash/snakeCase.js';
import pluralize from 'pluralize';
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
          format: `{name} | {bar} | {percentage}% | {value}/{total} | {repo}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true,
          forceRedraw: true
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

  const queueBar = progress.create(Infinity, 0, { name: '|>> jobs'.padStart(10), repo: '' });

  setInterval(async () => {
    const count = await queue
      .getJobCounts()
      .then((totals) => Object.values(totals).reduce((acc, total) => acc + total, 0));

    queueBar.setTotal(count);
    queueBar.update(count - (await queue.count()) - (await queue.getActiveCount()));
  }, 5000);

  const worker = createWorker(
    Repository,
    async (job) => {
      const knex = await connect(env.DATABASE_URL, {
        schema: job.data.full_name.replace('/', '@').replace(/[^a-zA-Z0-9_]/g, '_')
      });

      const task = new RepositoryUpdater(job.data.full_name, {
        service: new StorageService(service, new RelationalStorage(knex), { valid_by: 3 }),
        resources: [RepositoryUpdater.resources.find((r) => r.name === job.name) as any],
        parallel: true
      });

      const taskBar = progress.create(
        0,
        0,
        { name: job.name.toLowerCase().padStart(10), repo: job.data.full_name },
        { forceRedraw: true }
      );

      task.subscribe({
        next: async (notification) => {
          if (!notification.resource) {
            if (job.name !== User.name) {
              if (job.name === Issue.name) {
                taskBar.setTotal(
                  (notification.data._resources_counts?.issues || 0) +
                    (notification.data._resources_counts?.pull_requests || 0)
                );
              } else {
                taskBar.setTotal(
                  (notification.data._resources_counts as Record<string, number>)[pluralize(snakeCase(job.name))] || 0
                );
              }
            } else {
              const [total, count] = await Promise.all([
                knex(pluralize(snakeCase(User.name)))
                  .count({ count: '*' })
                  .then(([res]) => res.count as number),
                knex(pluralize(snakeCase(User.name)))
                  .whereNotNull('updated_at')
                  .count({ count: '*' })
                  .then(([res]) => res.count as number)
              ]);
              taskBar.setTotal(total);
              taskBar.update(count);
            }
          } else {
            if (!notification.done) {
              taskBar.increment(notification.data.length);
              job.updateProgress(taskBar.getProgress() * 100);
            }
          }
        }
      });

      return task
        .execute()
        .then(() => job.updateProgress(100))
        .then(() => queueBar.increment())
        .finally(() => {
          taskBar.stop();
          progress.remove(taskBar);
        })
        .finally(() => knex.destroy());
    },
    concurrency
  );

  worker.on('closed', () => {
    queueBar.stop();
    progress.remove(queueBar);
  });

  return worker;
}
