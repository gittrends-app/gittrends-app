import consola from 'consola';
import { GithubClient, GithubService } from '../src/services/index.js';

(async function main() {
  {
    consola.info('Running Github service example ...');
    const service = new GithubService(new GithubClient('https://api.github.com', { apiToken: process.env.GH_TOKEN }));

    consola.info(`Resolving repository octokit/octokit.js ...`);
    const repo = await service.repository('octokit', 'octokit.js');

    if (!repo) {
      consola.error('Repository not found.');
      process.exit(1);
    }

    const it = service.stargazers({ repository: repo.id, per_page: 10 });

    for await (const res of it) consola.log(res);

    consola.success('Done.');
  }
})();
