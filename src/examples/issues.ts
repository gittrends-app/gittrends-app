import consola from 'consola';
import stringifyObject from 'stringify-object';
import { github } from '../github/index.js';

(async () => {
  consola.info('Getting issues of octokit/rest.js...');
  const repo = await github.repos.get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  const iterator = github.repos.issues({ repo: repo.id });

  consola.info('Found issues:');
  for await (const { data, metadata } of iterator) {
    consola.info(`Metadata: ${stringifyObject(metadata)}`);
    for (const issue of data) {
      consola.info(`${issue.number++}. ${issue.title} (${issue.state})`);
    }
  }

  consola.success('Issues retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
