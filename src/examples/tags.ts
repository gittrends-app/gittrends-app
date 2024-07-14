import consola from 'consola';
import stringifyObject from 'stringify-object';
import { github } from '../github/index.js';

(async () => {
  consola.info('Getting tags of octokit/rest.js...');
  const repo = await github.repos.get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  const iterator = github.repos.tags({ repo: repo.id });

  consola.info('Found tags:');
  let index = 1;
  for await (const { data, params } of iterator) {
    consola.info(`Metadata: ${stringifyObject(params)}`);
    for (const tag of data) {
      consola.info(`${index++}. ${tag.name} (commit: ${tag.commit})`);
    }
  }

  consola.success('Tags retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
