import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import consola from 'consola';
import { MongoClient } from 'mongodb';
import { User } from '../entities/user.js';
import { github } from '../github/index.js';
import get from '../github/repository/get.js';
import { createMongoStorage } from '../storage/index.js';

(async () => {
  const conn = await MongoClient.connect('mongodb://localhost:27017');
  const storage = createMongoStorage(conn.db('github'));

  consola.log('================  Resource Example  ================');

  const repository = await input({
    message: 'Enter the repository name:',
    required: true,
    default: 'octokit/rest.js',
    validate: (value) => /.*\/.*/.test(value) || 'Invalid repository name.'
  });

  const resource: 'watchers' | 'stargazers' = await select({
    message: 'Select the resource to retrieve:',
    choices: [
      { name: 'Stargazers', value: 'stargazers' },
      { name: 'Watchers', value: 'watchers' }
    ]
  });

  consola.log('');
  consola.info(`Getting repository information...`);
  const [owner, name] = repository.split('/');
  const repo = await get({ owner: owner, name: name });
  if (!repo) throw new Error('Repository not found!');

  consola.info('Saving repository information...');
  await storage.repos.save(repo, true);

  consola.info(`Getting ${resource} ...`);
  switch (resource) {
    case 'stargazers':
    case 'watchers': {
      const iterator = github.repos[resource]({
        repo: resource === 'stargazers' ? repo.node_id : repo.id
      });

      let index = 1;
      for await (const { data, params } of iterator) {
        consola.log(chalk.bgGreen(`\nPage ${params.page}: ${data.length} ${resource} ...`));
        await storage[resource].save(data as any, true);
        for (const { user } of data) consola.log(`${index++}. ${(user as User).login}`);
      }
      break;
    }

    default:
      throw new Error('Invalid resource!');
  }

  consola.log('');
  consola.success('Done!');
  return conn.close();
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});