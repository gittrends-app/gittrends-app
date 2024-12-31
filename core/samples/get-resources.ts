import { input, select } from '@inquirer/prompts';
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

    const repoName = await input({
      message: 'Enter the repository name (e.g. octokit/octokit.js):',
      default: 'octokit/octokit.js',
      required: true,
      validate: (value) => value.split('/').length === 2
    });

    consola.info(`Resolving repository ${repoName} ...`);
    const [owner, name] = repoName.split('/');
    const repo = await service.repository(owner, name);

    if (repo) {
      consola.success(`Repository found:`);
      consola.log(prettyjson.render(repo));

      const resource = await select<any>({
        message: 'Which resource do you want to fetch?',
        choices: ['commits', 'discussions', 'issues', 'pull_requests', 'releases', 'stargazers', 'tags', 'watchers'],
        default: 'releases'
      });

      consola.info(`Fetching ${resource} of repository ${repo.name_with_owner} ...`);
      for await (const res of service.resources(resource, { repository: repo.id, per_page: 100 })) {
        consola.log(prettyjson.render(res));
      }

      consola.success('Done.');
    } else {
      consola.error('Repository not found.');
      process.exit(1);
    }
  }
})();
