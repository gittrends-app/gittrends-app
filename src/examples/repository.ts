import consola from 'consola';
import { MongoClient } from 'mongodb';
import stringify from 'stringify-object';
import { github } from '../github/index.js';
import { createMongoStorage } from '../storage/index.js';

(async () => {
  const owner = 'octokit';
  const name = 'rest.js';

  const repo = await github.repos.get({ owner, name });

  if (!repo) {
    consola.error(`Repository ${owner}/${name} not found.`);
    return;
  }

  consola.info(`Repository ${repo.full_name} found:`);
  consola.log(stringify(repo, { indent: '  ', singleQuotes: true }));

  const conn = await MongoClient.connect('mongodb://localhost:27017');
  const storage = createMongoStorage(conn.db('github'));

  await storage.repos.save(repo, false);

  return conn.close();
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
