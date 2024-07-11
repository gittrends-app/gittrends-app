import consola from 'consola';
import watchers from '../github/repository/watchers.js';

(async () => {
  consola.info('Getting watchers of octokit/octokit.js...');
  const users = await watchers({
    owner: 'octokit',
    name: 'octokit.js',
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
