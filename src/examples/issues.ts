import consola from 'consola';
import { github } from '../github/index.js';

(async () => {
  consola.info('Getting issues of octokit/rest.js...');
  const repo = await github.repos.get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  const iterator = github.repos.issues({ repo: repo.id, per_page: 25 });

  consola.info('Found issues:');
  for await (const { data } of iterator) {
    for (const issue of data) {
      consola.info(
        `${issue.__typename.toUpperCase()}-${issue.number}. ${issue.title.slice(0, 50)}${issue.title.length ? '...' : ''} (${issue.state} - ${typeof issue.__timeline === 'number' ? issue.__timeline : issue.__timeline?.length} events)`
      );
    }
  }

  consola.success('Issues retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
