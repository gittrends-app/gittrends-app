import consola from 'consola';
import { github } from '../github/index.js';

(async () => {
  consola.info('Searching for repositories...');
  const it = github.search.repos(1250);

  consola.info(`Found repositories:`);
  for await (const { data, params } of it) {
    for (const [index, repo] of data.entries()) {
      const position = (params.page - 1) * params.per_page + index + 1;
      consola.info(
        `${position}. ${repo.full_name} (${repo.stargazers_count} stars -- ${repo.language})`
      );
    }
  }

  consola.success('Search completed.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
