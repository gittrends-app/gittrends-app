import { Repository } from '@/core/index.js';
import env from '@/helpers/env.js';
import { Command, program } from 'commander';
import { connect } from './knex.js';
import { RelationalStorage } from './storage.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const run = (action: 'up' | 'down' | 'latest') => {
      connect(env.DATABASE_URL, { schema: 'public', migrate: true, migrateAction: action, forceFreeLock: true }).then(
        async (knex) => {
          const repos = await new RelationalStorage(knex).create(Repository).find({});
          for (const repo of repos) {
            await connect(env.DATABASE_URL, {
              schema: repo.full_name,
              migrate: true,
              migrateAction: action,
              forceFreeLock: true
            }).then((k) => k.destroy());
          }

          return knex.destroy();
        }
      );
    };

    program
      .name('migrations')
      .addCommand(new Command('up').action(() => run('up')))
      .addCommand(new Command('down').action(() => run('down')))
      .addCommand(new Command('latest').action(() => run('latest')))
      .parseAsync(process.argv);
  })();
}
