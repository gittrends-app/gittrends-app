import consola from 'consola';
import { searchRepositories } from '../github/search.js';

(async () => {
  consola.info('Searching for repositories...');
  const repos = await searchRepositories(1250, {
    onEach: (_, meta) =>
      consola.info(
        `${meta.count} repositories found (${meta.minStargazers}..${meta.maxStargazers || '*'}) ...`
      )
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
