import { CacheService, GithubService, Repository } from '@/core/index.js';
import { createCache } from '@/helpers/cache.js';
import githubClient from '@/helpers/github.js';
import mongo from '@/mongo/mongo.js';
import { MongoStorage } from '@/mongo/MongoStorage.js';
import { SingleBar } from 'cli-progress';
import { Argument, Option, program } from 'commander';
import consola from 'consola';

/**
 * CLI script to search for repositories.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('add')
    .addOption(
      new Option('-t, --total <total>', 'Total number of repositories to search')
        .makeOptionMandatory()
        .argParser(Number)
        .default(100)
    )
    .addArgument(new Argument('<name...>').argOptional())
    .helpOption('-h, --help', 'Display this help message')
    .action(async (names: string[], options: { total: number }) => {
      consola.info('Initializing services and storages...');
      const service = new CacheService(new GithubService(githubClient), await createCache());
      const storage = new MongoStorage(mongo.db('public'));

      const progress = new SingleBar({
        format: '{task}: [{bar}] {percentage}% | {duration_formatted} | {value}/{total}',
        stopOnComplete: true,
        clearOnComplete: true,
        hideCursor: true
      });

      const repos: Repository[] = [];

      consola.info('Starting the search...');
      if (names.length > 0) {
        for (const name of names) {
          const [owner, repo] = name.split('/');
          const res = await service.repository(owner, repo);
          if (!res) throw new Error(`Repository not found: ${name}`);
          repos.push(res);
        }
      } else {
        progress.start(options.total, 0, { task: 'searching' });
        for await (const { data } of service.search(options.total, { per_page: 50 })) {
          progress.increment(data.length);
          repos.push(...data);
        }
      }

      await Promise.resolve()
        .then(() => {
          progress.start(repos.length, 0, { task: 'updating' });
          return Promise.all(
            repos.map(async (repo) => {
              const detailedRepo = await service.repository(repo.id);
              if (detailedRepo) await storage.create('Repository').save(detailedRepo, true);
              progress.increment(1);
            })
          );
        })
        .then(() => {
          consola.success('Search completed!');
          return Promise.all([mongo.close(), progress.stop()]);
        })
        .catch((err) => {
          consola.error('Search failed!', err);
          process.exit(1);
        });
    })
    .parse(process.argv);
}
