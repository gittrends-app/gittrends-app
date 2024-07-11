import consola from 'consola';
import { createRestClient } from '../github/client.js';
import { searchRepositories } from '../github/search.js';

(async () => {
  consola.info('Searching for repositories...');
  const repos = await searchRepositories(50, {
    client: createRestClient(),
    onEachPage: (data, page) => consola.info(`Page ${page}: ${data.length} repositories found ...`)
  });

  consola.info(`Found ${repos.length} repositories:`);
  for (const [index, repo] of repos.entries()) {
    consola.info(
      `${index + 1}. ${repo.full_name} (${repo.stargazers_count} stars -- ${repo.language})`
    );
  }

  consola.success('Search completed.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
