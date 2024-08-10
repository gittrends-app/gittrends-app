import { GithubService, Repository, StorageService, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import githubClient from '@/helpers/github.js';
import { connect } from '@/knex/knex.js';
import { RelationalStorage } from '@/knex/storage.js';
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
      consola.info('Connecting to the database...');
      const db = await connect(env.DATABASE_URL, { schema: 'public', migrate: true });

      consola.info('Initializing the storage service...');
      const service = new StorageService(new GithubService(githubClient), new RelationalStorage(db), { valid_by: 1 });

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
        for await (const { data } of service.search(options.total)) {
          progress.increment(data.length);
          repos.push(...data);
        }
      }

      await Promise.resolve()
        .then(() => {
          progress.start(repos.length, 0, { task: 'updating' });
          return Promise.all(
            repos
              .map((repo) => [(repo.owner as User | undefined)?.id, (repo.organization as User | undefined)?.id])
              .flat()
              .filter((id) => id !== undefined)
              .map((id) => service.user(id).then(() => progress.increment(1)))
          );
        })
        .then(() => {
          progress.start(repos.length, 0, { task: 'running migrations' });
          return Promise.all(
            repos.map((repo) =>
              connect(env.DATABASE_URL, {
                schema: repo.full_name,
                migrate: true,
                migrateAction: 'latest',
                forceFreeLock: true
              }).then((db) => db.destroy())
            )
          );
        })
        .then(() => {
          consola.success('Search completed!');
          return Promise.all([db.destroy(), progress.stop()]);
        })
        .catch((err) => {
          consola.error('Search failed!', err);
          process.exit(1);
        });
    })
    .parse(process.argv);
}
