import consola from 'consola';
import watchers from '../github/repository/watchers.js';

(async () => {
  consola.info('Getting watchers of octokit/rest.js...');
  const iterator = watchers({
    owner: 'octokit',
    name: 'octokit.js'
  });

  consola.info('Found watchers:');
  let index = 1;
  for await (const { data } of iterator) {
    for (const watcher of data) {
      consola.info(`${index++}. ${watcher.login} (id: ${watcher.id})`);
    }
  }

  consola.success('Watchers retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
