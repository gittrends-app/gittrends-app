import knexjs, { Knex } from 'knex';
import { join } from 'node:path';
import pg from 'pg';

pg.types.setTypeParser(20, 'text', parseInt); // bigint

/**
 *  Convert a name to a schema name
 */
function toSchemaName(name: string): string {
  return name.replace('/', '@').replace(/[^a-zA-Z0-9_]/g, '_');
}

/**
 *  Connect to the database
 */
export async function connect(
  url: string,
  opts?: { schema: string; migrate?: boolean; migrateAction?: 'up' | 'down' | 'latest'; forceFreeLock?: boolean }
): Promise<Knex> {
  const conn = knexjs({
    client: 'pg',
    connection: url,
    searchPath: [opts?.schema ? toSchemaName(opts.schema) : 'public'],
    pool: { min: 0, max: 5 },
    migrations: {
      directory: join(import.meta.dirname, 'migrations'),
      tableName: 'knex_migrations'
    }
  });

  if (opts?.migrate) {
    await conn.raw(`CREATE SCHEMA IF NOT EXISTS ??`, [toSchemaName(opts.schema)]);
    if (opts.forceFreeLock) await conn.migrate.forceFreeMigrationsLock();
    await conn.migrate[opts.migrateAction || 'latest']({
      schemaName: toSchemaName(opts.schema)
    });
  }

  return conn;
}
