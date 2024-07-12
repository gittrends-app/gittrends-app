import consola from 'consola';
import stringify from 'stringify-object';
import { github } from '../github/index.js';

(async () => {
  const owner = 'octokit';

  let user = await github.users.get({ login: owner });
  consola.info(`User info: ${stringify(user, { indent: '  ' })}`);

  user = await github.users.get({ id: 3430433 });
  consola.info(`User info: ${stringify(user, { indent: '  ' })}`);

  user = await github.users.get({ id: Number.MAX_SAFE_INTEGER });
  consola.info(`User info: ${stringify(user, { indent: '  ' })}`);
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
