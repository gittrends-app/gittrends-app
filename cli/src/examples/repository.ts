import { Issue, Release, Stargazer, Tag, Watcher } from '@/core/entities/Entity.js';
import { GithubClient, GithubService, StorageService } from '@/core/services/index.js';
import env from '@/helpers/env.js';
import client from '@/mongo/client.js';
import { MongoStorage } from '@/mongo/storage.js';
import { RepositoryUpdater } from '@/updater/repository.js';
import { checkbox, input } from '@inquirer/prompts';
import { Presets, SingleBar } from 'cli-progress';
import consola from 'consola';
import pluralize from 'pluralize';
import { Class } from 'type-fest';

(async () => {
  const conn = await client.connect();

  consola.log('================  Resource Example  ================');

  const repository = await input({
    message: 'Enter the repository name:',
    required: true,
    default: 'octokit/rest.js',
    validate: (value) => /.*\/.*/.test(value) || 'Invalid repository name.'
  });

  const resources = await checkbox<Class<Issue | Tag | Release | Stargazer | Watcher>>({
    message: 'Select the resources to retrieve:',
    choices: [
      { value: Issue, name: 'issues', checked: true },
      { value: Release, name: 'releases', checked: true },
      { value: Stargazer, name: 'stargazers', checked: true },
      { value: Tag, name: 'tags', checked: true },
      { value: Watcher, name: 'watchers', checked: true }
    ],
    required: true
  });

  consola.info('Initializing the Github service...');
  const baseService = new GithubService(new GithubClient(env.GITHUB_API_BASE_URL, { apiToken: env.GITHUB_API_TOKEN }));

  const [owner, name] = repository.split('/');
  const repo = await baseService.repository(owner, name);
  if (!repo) throw new Error('Repository not found.');

  const service = new StorageService(
    baseService,
    new MongoStorage(conn.db(`${repo.id}@${repo.full_name.replace(/[/.]/g, '_')}`)),
    { valid_by: 1 }
  );

  consola.info('Starting the repository update...');
  const progress = new SingleBar(
    { format: ' {bar} {percentage}% | {duration_formatted} | {message}' },
    Presets.shades_grey
  );

  progress.start(resources.length + 1, 0, { message: '...' });

  const task = new RepositoryUpdater(repository, { service, resources, parallel: true });

  const count: Record<string, number> = {};

  task.subscribe({
    next: (notification) => {
      if (!notification.resource) {
        progress.increment(1, { message: 'repository update' });
      } else {
        const name = notification.resource.prototype._entityname;
        if (!notification.finished) count[name] = (count[name] || 0) + (notification.data.length || 0);
        progress.increment(notification.finished ? 1 : 0, {
          message: `${count[name]} ${pluralize(name)} (${notification.finished ? 'finished' : 'in progress'})`
        });
      }
    }
  });

  return task
    .execute()
    .then(() => Promise.all([conn.close(), progress.stop()]))
    .finally(() => consola.success('Done!'));
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
