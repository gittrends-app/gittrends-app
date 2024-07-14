import consola from 'consola';
import stringifyObject from 'stringify-object';
import { github } from '../github/index.js';
import get from '../github/repository/get.js';

(async () => {
  consola.info('Getting tags of octokit/rest.js...');
  const repo = await get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  const iterator = github.repos.releases({ repo: repo.id });

  consola.info('Found tags:');
  let index = 1;
  for await (const { data, params } of iterator) {
    consola.info(`Metadata: ${stringifyObject(params)}`);
    for (const tag of data) {
      consola.info(
        `${index++}. ${tag.name} (source: ${tag.target_commitish} - at: ${tag.published_at?.toISOString()})`
      );
    }
  }

  consola.success('Tags retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
