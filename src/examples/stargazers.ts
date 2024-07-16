import consola from 'consola';
import { MongoClient } from 'mongodb';
import { github } from '../github/index.js';
import { createMongoStorage } from '../storage/index.js';

(async () => {
  const conn = await MongoClient.connect('mongodb://localhost:27017');
  const storage = createMongoStorage(conn.db('github'));

  consola.info('Getting tags of octokit/rest.js...');
  const repo = await github.repos.get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  consola.info('Getting stargazers of octokit/rest.js...');
  const iterator = github.repos.stargazers({ repo: repo.node_id });

  consola.info('Found stargazers:');
  let index = 1;
  for await (const { data } of iterator) {
    await storage.stargazers.save(data, true);
    for (const star of data) {
      consola.info(
        `${index++}. ${typeof star.user === 'number' ? star.user : star.user?.login} at ${star.starred_at.toISOString()}`
      );
    }
  }

  consola.success('Watchers retrieved.');
  return conn.close();
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
