import consola from 'consola';
import stringify from 'stringify-object';
import { github } from '../github/index.js';

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
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
