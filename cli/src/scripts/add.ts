import { GithubService, Repository, StorageService } from '@/core/index.js';
import { FullFragmentFactory, PartialFragmentFactory } from '@/core/services/github/graphql/fragments/Fragment.js';
import githubClient from '@/helpers/github.js';
import mongo from '@/mongo/mongo.js';
import { MongoStorageFactory } from '@/mongo/MongoStorage.js';
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
      consola.info('Initializing the storage service...');
      const gService = new GithubService(githubClient, new PartialFragmentFactory());
      const service = new StorageService(gService, new MongoStorageFactory(mongo.db('_public')));

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
        for await (const { data } of service.search(options.total, { first: 100 })) {
          progress.increment(data.length);
          repos.push(...data);
        }
      }

      gService.setFragmentFactory(new FullFragmentFactory());

      await Promise.resolve()
        .then(() => {
          progress.start(repos.length, 0, { task: 'updating' });
          return Promise.all(
            repos.map((repo) => repo.id).map((id) => service.repository(id).then(() => progress.increment(1)))
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
