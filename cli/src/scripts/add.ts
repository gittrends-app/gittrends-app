import { createCache } from '@/helpers/cache.js';
import githubClient from '@/helpers/github.js';
import mongo from '@/mongo/mongo.js';
import { MongoStorage } from '@/mongo/MongoStorage.js';
import { CacheService, GithubService, Repository, Service } from '@gittrends-app/core';
import { confirm } from '@inquirer/prompts';
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
    .addOption(new Option('--language [language]', 'Programming language to search'))
    .addOption(new Option('--name [language]', 'Find repositories containing the provided name'))
    .addOption(new Option('--no-confirm', 'Requires no confirmation to proceed with inserts'))
    .addOption(new Option('--no-cache', 'Do not use cached results'))
    .addArgument(new Argument('<name...>').argOptional())
    .helpOption('-h, --help', 'Display this help message')
    .action(
      async (
        names: string[],
        options: { total: number; language?: string; name?: string; confirm: boolean; cache: boolean }
      ) => {
        let service: Service = new GithubService(githubClient);
        if (options.cache) service = new CacheService(service, createCache({ namespace: 'public' }));

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
          const it = service.search(options.total, {
            per_page: 50,
            language: options.language,
            name: options.name
          });
          for await (const { data } of it) {
            progress.increment(data.length);
            repos.push(...data);
          }
        }

        await Promise.resolve()
          .then(async () => {
            let proceed = true;
            if (options.confirm) {
              consola.info('Repositories found:');
              for (const [index, repo] of repos.entries()) {
                consola.log(
                  `#${index + 1} - ${repo.name_with_owner} (${repo.stargazers_count} stars, ${repo.primary_language || 'N/A'})`
                );
              }
              proceed = await confirm({ message: 'Would you like to proceed with the inserts?', default: false });
            }

            if (proceed) {
              progress.start(repos.length, 0, { task: 'updating' });
              await Promise.all(
                repos.map(async (repo) => {
                  const detailedRepo = await service.repository(repo.id);
                  if (detailedRepo) await storage.create('Repository').save(detailedRepo, true);
                  progress.increment(1);
                })
              );

              consola.success('Search completed and repositories inserted!');
            } else {
              consola.fail('Repositories not inserted.');
            }
          })
          .then(() => Promise.all([mongo.close(), progress.stop()]))
          .catch((err) => {
            consola.error('Search failed!', err);
            process.exit(1);
          });
      }
    )
    .parse(process.argv);
}
