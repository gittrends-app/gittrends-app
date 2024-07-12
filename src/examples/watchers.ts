import consola from 'consola';
import stringifyObject from 'stringify-object';
import get from '../github/repository/get.js';
import { watchers } from '../github/repository/resources/index.js';

(async () => {
  consola.info('Getting tags of octokit/rest.js...');
  const repo = await get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  consola.info('Getting watchers of octokit/rest.js...');
  const iterator = watchers({ repo: repo.id });

  consola.info('Found watchers:');
  let index = 1;
  for await (const { data, metadata } of iterator) {
    consola.info(`Metadata: ${stringifyObject(metadata)}`);
    for (const watcher of data) {
      consola.info(
        `${index++}. ${typeof watcher.user === 'number' ? watcher.user : watcher.user.login}`
      );
    }
  }

  consola.success('Watchers retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
