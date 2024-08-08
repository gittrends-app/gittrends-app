import env from '@/helpers/env.js';
import { Command, program } from 'commander';
import { connect } from './knex.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const knex = await connect(env.DATABASE_URL, { schema: 'public', migrate: false });

    program
      .name('migrations')
      .addCommand(new Command('up').action(() => knex.migrate.up().then(() => knex.destroy())))
      .addCommand(new Command('down').action(() => knex.migrate.down().then(() => knex.destroy())))
      .addCommand(new Command('latest').action(() => knex.migrate.latest().then(() => knex.destroy())))
      .parseAsync(process.argv);
  })();
}
