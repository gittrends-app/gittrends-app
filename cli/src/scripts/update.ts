import { createCache } from '@/helpers/cache.js';
import env from '@/helpers/env.js';
import githubClient from '@/helpers/github.js';
import mongo from '@/mongo/mongo.js';
import { MongoStorage } from '@/mongo/MongoStorage.js';
import { CacheService, GithubService, Service } from '@gittrends-app/core';
import { Cache, Geocoder, OpenStreetMap } from '@gittrends-app/geocoder-core';
import { Worker } from 'bullmq';
import { MultiBar, Presets } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import readline from 'readline';
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

      consola.info('Initializing the storage service...');
      const service = new CacheService(new GithubService(githubClient), createCache({ resource: 'users' }));

      consola.info('Initializing the geocoder...');
      const geocoder = new Cache(new OpenStreetMap({ concurrency: env.GEOCODER_CONCURRENCY }), {
        dirname: env.GEOCODER_CACHE_DIR,
        size: env.GEOCODER_CACHE_SIZE,
        ttl: env.GEOCODER_CACHE_TTL
      });

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

      const worker = reposUpdate(service, geocoder, opts.workers, progress);

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
function reposUpdate(service: Service, geocoder: Geocoder, concurrency: number, progress: MultiBar): Worker {
  const queue = createQueue('repos');

  const queueBar = progress.create(Infinity, 0, { name: 'jobs'.padStart(13), repo: '' });

  setInterval(async () => {
    const count = await queue
      .getJobCounts()
      .then((totals) => Object.values(totals).reduce((acc, total) => acc + total, 0));

    queueBar.setTotal(count);
    queueBar.update(count - (await queue.count()) - (await queue.getActiveCount()));
  }, 5000);

  const worker = createWorker(
    'repos',
    async (job) => {
      const resources = (job.data.resources || [])
        .map((r) => RepositoryUpdater.resources.find((res) => res === r))
        .filter((r) => r !== undefined);

      const dbName = job.data.name_with_owner
        .replace('/', '@')
        .replace(/[^a-zA-Z0-9@_]/g, '_')
        .toLowerCase();

      const storage = new MongoStorage(mongo.db(dbName));

      const task = new RepositoryUpdater(job.data.name_with_owner, {
        service: new CacheService(service, createCache({ namespace: dbName })),
        storage,
        geocoder,
        resources,
        parallel: true
      });

      const taskBar = progress.create(
        Infinity,
        0,
        { name: ''.padStart(13), repo: job.data.name_with_owner, resValue: 0, resTotal: resources.length },
        {
          format: `{name} | {bar} | {percentage}% | {resValue}/{resTotal} | {value}/{total} | {repo}`,
          forceRedraw: true
        }
      );

      let finishedResources = 0;
      let resourcesSum = Infinity;

      const totals: Record<string, number> = {};

      const usersUpdateTimeout = setInterval(async () => {
        return storage
          .create('Actor')
          .count({})
          .then((total) => taskBar.setTotal(resourcesSum + total));
      }, 10000);

      task.subscribe({
        next: async (notification) => {
          if (!notification.resource) {
            taskBar.setTotal(
              (resourcesSum = resources.reduce(
                (acc, res) => acc + ((notification.data as any)[`${res}_count`] || 0),
                0
              ))
            );
          } else {
            if (!notification.done) {
              if (notification.total) {
                totals[notification.resource] = notification.total || 0;
                taskBar.update(
                  Object.values(totals).reduce((sum, v) => sum + v, 0),
                  { name: notification.resource.padStart(13) }
                );
              } else {
                totals[notification.resource] = notification.data.length;
                taskBar.increment(notification.data.length, {
                  name: notification.resource.padStart(13)
                });
              }
              job.updateProgress(taskBar.getProgress() * 100);
            } else {
              taskBar.increment(0, { resValue: ++finishedResources });
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
        .finally(() => clearInterval(usersUpdateTimeout))
        .finally(() => mongo.close());
    },
    concurrency
  );

  worker.on('closed', () => {
    queueBar.stop();
    progress.remove(queueBar);
  });

  return worker;
}
