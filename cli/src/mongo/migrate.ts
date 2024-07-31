import env from '@/helpers/env.js';
import * as migrate from 'migrate-mongo';
import { Db, MongoClient } from 'mongodb';
import { resolve } from 'path';

/**
 *  Run migrations
 */
async function up(db: Db, client: MongoClient): Promise<void> {
  migrate.config.set({
    mongodb: { url: env.MONGO_URL, databaseName: db.databaseName },
    migrationsDir: resolve(import.meta.dirname, 'migrations'),
    changelogCollectionName: '_migrations_',
    migrationFileExtension: '.ts'
  });

  await migrate.up(db, client);
}

export default { up };
