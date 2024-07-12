import consola from 'consola';
import { github } from '../github/index.js';

(async () => {
  consola.info('Getting tags of octokit/rest.js...');
  const repo = await github.repos.get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  consola.info('Getting stargazers of octokit/rest.js...');
  const iterator = github.repos.stargazers({ repo: repo.node_id });

  consola.info('Found stargazers:');
  let index = 1;
  for await (const { data } of iterator) {
    for (const star of data) {
      consola.info(
        `${index++}. ${typeof star.user === 'number' ? star.user : star.user?.login} at ${star.starred_at.toISOString()}`
      );
    }
  }

  consola.success('Watchers retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
