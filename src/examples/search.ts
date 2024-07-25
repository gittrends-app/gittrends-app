import consola from 'consola';
import env from '../env.js';
import { GithubClient } from '../services/github/client.js';
import { GithubService } from '../services/github/service.js';
import { Service } from '../services/service.js';

(async () => {
  consola.info('Initializing the Github service...');
  const client: Service = new GithubService(
    new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN })
  );

  consola.info('Searching for repositories...');
  for await (const { data, params } of client.search(125)) {
    for (const [index, repo] of data.entries()) {
      const position = (params.page - 1) * params.per_page + index + 1;
      consola.info(`${position}. ${repo.full_name} (${repo.stargazers_count} stars -- ${repo.language})`);
    }
  }

  consola.success('Search completed.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
