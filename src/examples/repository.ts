import consola from 'consola';
import stringify from 'stringify-object';
import { createRestClient } from '../github/client.js';
import get from '../github/repository/get.js';

(async () => {
  const owner = 'octokit';
  const name = 'rest.js';

  const repo = await get(owner, name, { client: createRestClient() });

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
