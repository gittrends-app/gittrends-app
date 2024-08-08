import knexjs, { Knex } from 'knex';
import { join } from 'node:path';
import pg from 'pg';

pg.types.setTypeParser(20, 'text', parseInt); // bigint

/**
 *  Connect to the database
 */
export async function connect(url: string, opts?: { schema: string; migrate: boolean }): Promise<Knex> {
  const conn = knexjs({
    client: 'pg',
    connection: url,
    searchPath: [opts?.schema || 'public'],
    pool: { min: 0, max: 3 },
    migrations: {
      directory: join(import.meta.dirname, 'migrations'),
      tableName: 'knex_migrations'
    }
  });

  if (opts?.migrate) {
    await conn.raw(`CREATE SCHEMA IF NOT EXISTS ??`, [opts.schema]);
    await conn.migrate.latest({ schemaName: opts.schema });
  }

  return conn;
}
