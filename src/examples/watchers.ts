import consola from 'consola';
import { createRestClient } from '../github/client.js';
import { watchers } from '../github/repository.js';

(async () => {
  consola.info('Getting watchers of octokit/octokit.js...');
  const users = await watchers('octokit', 'octokit.js', {
    client: createRestClient(),
    onEach: (_, meta) => consola.info(`${meta.count} watchers found...`)
  });

  consola.info('Found watchers:');
  for await (const [index, user] of users.entries()) {
    consola.info(`${index + 1}. ${user.login} (id: ${user.id})`);
  }

  consola.success('Watchers retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
