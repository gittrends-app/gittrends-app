import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import consola from 'consola';
import { MongoClient } from 'mongodb';
import { Entity, Issue, Release, Stargazer, Tag, User, Watcher } from '../entities/Entity.js';
import env from '../env.js';
import { GithubClient } from '../services/github/client.js';
import { GithubService } from '../services/github/service.js';
import { IterableEntity, Service } from '../services/service.js';
import { MongoStorage } from '../services/storage/mongo.js';
import { StorageService } from '../services/storage/service.js';

(async () => {
  const conn = await MongoClient.connect('mongodb://localhost:27017');

  consola.log('================  Resource Example  ================');

  const repository = await input({
    message: 'Enter the repository name:',
    required: true,
    default: 'octokit/rest.js',
    validate: (value) => /.*\/.*/.test(value) || 'Invalid repository name.'
  });

  const resource = await select<'issues' | 'tags' | 'releases' | 'stargazers' | 'watchers'>({
    message: 'Select the resource to retrieve:',
    choices: [
      { value: 'issues' },
      { value: 'releases' },
      { value: 'stargazers' },
      { value: 'tags' },
      { value: 'watchers' }
    ]
  });

  consola.info('Initializing the Github service...');
  const client: Service = new StorageService(
    new GithubService(new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN })),
    new MongoStorage(conn.db('github'))
  );

  consola.log('');
  consola.info(`Getting repository information...`);
  const [owner, name] = repository.split('/');
  const repo = await client.repository(owner, name);
  if (!repo) throw new Error('Repository not found!');

  const map = {
    tags: {
      it: () => client.resource('tags', { repo: repo }),
      print: (entity: Tag, index) => consola.log(`${index || '?'}. ${entity.name}`)
    },
    releases: {
      it: () => client.resource('releases', { repo: repo }),
      print: (entity: Release, index) => consola.log(`${index || '?'}. ${entity.name}`)
    },
    stargazers: {
      it: () => client.resource('stargazers', { repo: repo }),
      print: (entity: Stargazer, index) => consola.log(`${index || '?'}. ${(entity.user as User).login}`)
    },
    watchers: {
      it: () => client.resource('watchers', { repo: repo }),
      print: (entity: Watcher, index) => consola.log(`${index || '?'}. ${(entity.user as User).login}`)
    },
    issues: {
      it: () => client.resource('issues', { repo: repo, per_page: 25 }),
      print: (issue: Issue) =>
        consola.log(
          `${issue.constructor.name.toUpperCase()}-${issue.number}. ${issue.title.slice(0, 50)}${issue.title.length ? '...' : ''} (${issue.state} - ${typeof issue.events.length} events)`
        )
    }
  } satisfies Record<
    typeof resource,
    { it: () => IterableEntity<Entity>; print: (entity: any, index?: number) => any }
  >;

  let index = 1;
  consola.info(`Getting ${resource} ...`);
  for await (const { data, params } of map[resource].it()) {
    consola.log(chalk.bgGreen(`\nPage ${params.page}: ${data.length} ${resource} ...`));
    for (const item of data) map[resource].print(item as any, index++);
  }

  consola.log('');
  consola.success('Done!');

  return conn.close();
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
