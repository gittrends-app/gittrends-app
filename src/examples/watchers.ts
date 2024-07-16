import consola from 'consola';
import { MongoClient } from 'mongodb';
import stringifyObject from 'stringify-object';
import { github } from '../github/index.js';
import get from '../github/repository/get.js';
import { createMongoStorage } from '../storage/index.js';

(async () => {
  const conn = await MongoClient.connect('mongodb://localhost:27017');
  const storage = createMongoStorage(conn.db('github'));

  consola.info('Getting tags of octokit/rest.js...');
  const repo = await get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  consola.info('Getting watchers of octokit/rest.js...');
  const iterator = github.repos.watchers({ repo: repo.id });

  consola.info('Found watchers:');
  let index = 1;
  for await (const { data, params: metadata } of iterator) {
    await storage.watchers.save(data, true);
    consola.info(`Metadata: ${stringifyObject(metadata)}`);
    for (const watcher of data) {
      consola.info(
        `${index++}. ${typeof watcher.user === 'number' ? watcher.user : watcher.user.login}`
      );
    }
  }

  consola.success('Watchers retrieved.');
  return conn.close();
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
