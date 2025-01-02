import { createCache } from '@/helpers/cache.js';
import env from '@/helpers/env';
import githubClient from '@/helpers/github.js';
import mongo from '@/mongo/mongo.js';
import { MongoStorage } from '@/mongo/MongoStorage.js';
import { CacheService, GithubService } from '@gittrends-app/core';
import { Cache, OpenStreetMap } from '@gittrends-app/geocoder-core';
import { MultiBar, SingleBar } from 'cli-progress';
import { Argument, Option, program } from 'commander';
import consola from 'consola';
import { RepositoryUpdater } from './shared/RepositoryUpdater';

/**
 * CLI script to update a repository.
 */
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

      const dbName = nameWithOwner
        .replace('/', '@')
        .replace(/[^a-zA-Z0-9@_]/g, '_')
        .toLowerCase();

      consola.info('Initializing the Github service...');
      const storageFactory = new MongoStorage(mongo.db(dbName));

      const replicaService = new CacheService(
        new CacheService(new GithubService(githubClient), createCache({ resource: 'users' })),
        createCache({ namespace: dbName })
      );

      consola.info('Initializing the geocoder...');
      const geocoder = new Cache(new OpenStreetMap({ concurrency: env.GEOCODER_CONCURRENCY }), {
        dirname: env.GEOCODER_CACHE_DIR,
        size: env.GEOCODER_CACHE_SIZE,
        ttl: env.GEOCODER_CACHE_TTL
      });

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
        storage: storageFactory,
        geocoder: geocoder,
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
