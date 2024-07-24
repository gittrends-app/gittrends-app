import { input, select } from '@inquirer/prompts';
import chalk from 'chalk';
import consola from 'consola';
import { MongoClient } from 'mongodb';
import { Entity, Issue, Release, Stargazer, Tag, User, Watcher } from '../entities/entity.js';
import { IterableResource } from '../github/_requests_/index.js';
import { github } from '../github/index.js';
import get from '../github/repository/get.js';
import { createMongoStorage } from '../storage/index.js';
import { withStorage, withStorageIt } from '../storage/withStorage.js';

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

  const resource = await select<'issues' | 'releases' | 'stargazers' | 'tags' | 'watchers'>({
    message: 'Select the resource to retrieve:',
    choices: [
      { value: 'issues' },
      { value: 'releases' },
      { value: 'stargazers' },
      { value: 'tags' },
      { value: 'watchers' }
    ]
  });

  consola.log('');
  consola.info(`Getting repository information...`);
  const [owner, name] = repository.split('/');
  const repo = await withStorage(get)({ owner: owner, name: name, storage: storage.repos });
  if (!repo) throw new Error('Repository not found!');

  const map = {
    stargazers: {
      it: () =>
        withStorageIt(github.repos.stargazers)({
          repo: repo,
          storage: storage.stargazers
        }),
      print: (entity: Stargazer, index) =>
        consola.log(`${index || '?'}. ${(entity.user as User).login}`)
    },
    watchers: {
      it: () =>
        withStorageIt(github.repos.watchers)({
          repo: repo,
          storage: storage.watchers
        }),
      print: (entity: Watcher, index) =>
        consola.log(`${index || '?'}. ${(entity.user as User).login}`)
    },
    tags: {
      it: () =>
        withStorageIt(github.repos.tags)({
          repo: repo,
          storage: storage.tags
        }),
      print: (entity: Tag, index) => consola.log(`${index || '?'}. ${entity.name}`)
    },
    releases: {
      it: () =>
        withStorageIt(github.repos.releases)({
          repo: repo,
          storage: storage.releases
        }),
      print: (entity: Release, index) => consola.log(`${index || '?'}. ${entity.name}`)
    },
    issues: {
      it: () =>
        withStorageIt(github.repos.issues)({
          repo: repo,
          per_page: 25,
          storage: storage.issues
        }),
      print: (issue: Issue) =>
        consola.log(
          `${issue.__typename.toUpperCase()}-${issue.number}. ${issue.title.slice(0, 50)}${issue.title.length ? '...' : ''} (${issue.state} - ${typeof issue.__timeline === 'number' ? issue.__timeline : issue.__timeline?.length} events)`
        )
    }
  } satisfies Record<
    string,
    { it: () => IterableResource<Entity>; print: (entity: any, index?: number) => any }
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
