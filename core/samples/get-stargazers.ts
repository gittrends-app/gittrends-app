import consola from 'consola';
import prettyjson from 'prettyjson';
import { FragmentFields, GithubClient, GithubService } from '../src/services/index.js';

(async function main() {
  {
    consola.info('Creating Github client ...');
    const client = new GithubClient('https://api.github.com', { apiToken: process.env.GH_TOKEN });

    consola.info('Selecting fields from common entities, such as actors ...');
    const fields: FragmentFields = { actors: { name: true, email: true } };

    consola.info('Preparing Github service example ...');
    const service = new GithubService(client, { fields });

    consola.info(`Resolving repository octokit/octokit.js ...`);
    const repo = await service.repository('octokit', 'octokit.js');

    if (repo) {
      consola.success(`Repository found:`);
      consola.log(prettyjson.render(repo));

      consola.info(`Fetching stargazers of repository ${repo.name_with_owner} ...`);
      const it = service.resources('stargazers', { repository: repo.id, per_page: 100 });

      consola.info('Stargazers:');
      for await (const res of it) consola.log(prettyjson.render(res));

      consola.success('Done.');
    } else {
      consola.error('Repository not found.');
      process.exit(1);
    }
  }
})();
