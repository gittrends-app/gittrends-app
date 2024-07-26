import { Entity, Issue, Release, Stargazer, Tag, User, Watcher } from '@/core/entities/Entity.js';
import { GithubClient, GithubService, IterableEntity, Service, StorageService } from '@/core/services/index.js';
import { MongoStorage } from '@/db/mongo-storage.js';
import env from '@/helpers/env.js';
import { checkbox, input } from '@inquirer/prompts';
import chalk from 'chalk';
import consola from 'consola';
import { MongoClient } from 'mongodb';
import { ArrayValues } from 'type-fest';

(async () => {
  const conn = await MongoClient.connect('mongodb://localhost:27017');

  consola.log('================  Resource Example  ================');

  const repository = await input({
    message: 'Enter the repository name:',
    required: true,
    default: 'octokit/rest.js',
    validate: (value) => /.*\/.*/.test(value) || 'Invalid repository name.'
  });

  const resources = await checkbox<'issues' | 'tags' | 'releases' | 'stargazers' | 'watchers'>({
    message: 'Select the resources to retrieve:',
    choices: [
      { value: 'issues' },
      { value: 'releases' },
      { value: 'stargazers' },
      { value: 'tags' },
      { value: 'watchers' }
    ],
    required: true
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
      it: () => client.resource(Tag, { repo: repo }),
      print: (entity: Tag, index) => consola.log(`${index || '?'}. ${entity.name}`)
    },
    releases: {
      it: () => client.resource(Release, { repo: repo }),
      print: (entity: Release, index) => consola.log(`${index || '?'}. ${entity.name}`)
    },
    stargazers: {
      it: () => client.resource(Stargazer, { repo: repo }),
      print: (entity: Stargazer, index) => consola.log(`${index || '?'}. ${(entity.user as User).login}`)
    },
    watchers: {
      it: () => client.resource(Watcher, { repo: repo }),
      print: (entity: Watcher, index) => consola.log(`${index || '?'}. ${(entity.user as User).login}`)
    },
    issues: {
      it: () => client.resource(Issue, { repo: repo, per_page: 25 }),
      print: (issue: Issue) =>
        consola.log(
          `${issue.constructor.name.toUpperCase()}-${issue.number}. ${issue.title.slice(0, 50)}${issue.title.length ? '...' : ''} (${issue.state} - ${typeof issue._events.length} events)`
        )
    }
  } satisfies Record<
    ArrayValues<typeof resources>,
    { it: () => IterableEntity<Entity>; print: (entity: any, index?: number) => any }
  >;

  for (const resource of resources) {
    let index = 1;
    consola.info(`Getting ${resource} ...`);
    for await (const { data, params } of map[resource].it()) {
      consola.log(chalk.bgGreen(`\nPage ${params.page}: ${data.length} ${resource} ...`));
      for (const item of data) map[resource].print(item as any, index++);
    }
  }

  consola.log('');
  consola.success('Done!');

  return conn.close();
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
