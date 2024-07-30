import { Release } from '../../../entities/Entity.js';
import { GithubClient } from '../client.js';
import { iterator } from '../requests/index.js';
import { ResourcesParams } from './index.js';
import _reactions from './reactions.js';

/**
 * Get the releases of a repository by its id
 */
export default function (client: GithubClient, options: ResourcesParams) {
  return {
    [Symbol.asyncIterator]: async function* () {
      const it = iterator(
        {
          client,
          url: 'GET /repositories/:repo/releases',
          Entity: Release,
          metadata: { repository: options.repo.node_id }
        },
        { ...options, repo: options.repo.id }
      );

      for await (const { data, params } of it) {
        for (const release of data) {
          release._reactions = await _reactions(client, release, options);
        }

        yield { data, params };
      }
    }
  };
}
