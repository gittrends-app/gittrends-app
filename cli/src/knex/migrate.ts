import { Command, program } from 'commander';
import { knex } from './knex.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('migrations')
    .addCommand(new Command('up').action(() => knex.migrate.up().then(() => knex.destroy())))
    .addCommand(new Command('down').action(() => knex.migrate.down().then(() => knex.destroy())))
    .addCommand(new Command('latest').action(() => knex.migrate.latest().then(() => knex.destroy())))
    .parseAsync(process.argv);
}
