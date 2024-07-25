import { Watcher } from '../../../entities/Entity.js';
import { GithubClient } from '../client.js';
import { iterator } from '../requests/index.js';
import { ResourcesParams } from './index.js';

/**
 * Get the tags of a repository by its id
 */
export default function (client: GithubClient, options: ResourcesParams) {
  return iterator(
    {
      client,
      url: 'GET /repositories/:repo/subscribers',
      Entity: Watcher,
      metadata: { repository: options.repo.node_id }
    },
    { ...options, repo: options.repo.id }
  );
}
