import consola from 'consola';
import stringifyObject from 'stringify-object';
import get from '../github/repository/get.js';
import { tags } from '../github/repository/resources/index.js';

(async () => {
  consola.info('Getting tags of octokit/rest.js...');
  const repo = await get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  const iterator = tags({ repo: repo.id });

  consola.info('Found tags:');
  let index = 1;
  for await (const { data, metadata } of iterator) {
    consola.info(`Metadata: ${stringifyObject(metadata)}`);
    for (const tag of data) {
      consola.info(`${index++}. ${tag.name} (commit: ${tag.commit})`);
    }
  }

  consola.success('Tags retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
