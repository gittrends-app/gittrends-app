import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import migrate from '@/mongo/migrate.js';
import consola from 'consola';

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    consola.info('Connecting to the database...');
    await client.connect();

    consola.info('Running migrations...');
    await migrate.up(client.db(env.MONGO_DB), client);

    consola.info('Migrations completed successfully!');
    await client.close();
  })();
}
