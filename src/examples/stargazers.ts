import consola from 'consola';
import stargazers from '../github/repository/stargazers.js';

(async () => {
  consola.info('Getting stargazers of octokit/rest.js...');
  const iterator = stargazers({
    owner: 'octokit',
    name: 'rest.js'
  });

  consola.info('Found stargazers:');
  let index = 1;
  for await (const { data } of iterator) {
    for (const star of data) {
      consola.info(
        `${index++}. ${star.user?.login} (id: ${star.user?.id}) at ${star.starred_at.toISOString()}`
      );
    }
  }

  consola.success('Watchers retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
