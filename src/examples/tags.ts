import consola from 'consola';
import tags from '../github/repository/tags.js';

(async () => {
  consola.info('Getting tags of octokit/rest.js...');
  const iterator = tags({
    owner: 'octokit',
    name: 'rest.js'
  });

  consola.info('Found tags:');
  let index = 1;
  for await (const { data } of iterator) {
    for (const tag of data) {
      consola.info(`${index++}. ${tag.name} (commit: ${tag.commit})`);
    }
  }

  consola.success('Tags retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
