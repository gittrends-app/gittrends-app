import env from '@/helpers/env.js';
import knexjs from 'knex';
import { join } from 'node:path';

export const knex = knexjs({
  client: 'pg',
  connection: env.DATABASE_URL,
  searchPath: ['public'],
  migrations: {
    directory: join(import.meta.dirname, 'migrations'),
    tableName: 'knex_migrations'
  }
});
