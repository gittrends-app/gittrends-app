import { Issue, PullRequest, TimelineEvent } from '../../../entities/Entity.js';
import { Iterable } from '../../service.js';
import { GithubClient } from '../client.js';
import { iterator, request } from '../requests/index.js';
import { ResourcesParams } from './index.js';
import _reactions from './reactions.js';

/**
 * Get the timeline of an issue by its id
 */
function timeline(
  client: GithubClient,
  { issue, ...options }: ResourcesParams & { issue: { number: number; node_id: string } }
) {
  return iterator(
    {
      client,
      url: 'GET /repositories/:repo/issues/:number/timeline',
      Entity: TimelineEvent,
      metadata: { repository: options.repo.node_id, issue: issue.node_id }
    },
    { ...options, repo: options.repo.id, number: issue.number }
  );
}

/**
 * Get a pull request by number.
 */
function pullRequest(client: GithubClient, params: { repo: { id: number; node_id: string }; number: number }) {
  return request(
    {
      client,
      url: 'GET /repositories/:repo/pulls/:number',
      Entity: PullRequest,
      metadata: { repository: params.repo.node_id }
    },
    { repo: params.repo.id, number: params.number }
  );
}

/**
 * Get the issues of a repository by its id
 *
 */
export default function (
  client: GithubClient,
  options: ResourcesParams & { since?: Date }
): Iterable<Issue | PullRequest, { since?: Date }> {
  return {
    [Symbol.asyncIterator]: async function* () {
      let { since } = options;

      const it = iterator(
        {
          client,
          url: 'GET /repositories/:repo/issues',
          Entity: Issue,
          metadata: { repository: options.repo.node_id }
        },
        {
          ...options,
          repo: options.repo.id,
          state: 'all',
          sort: 'updated',
          direction: 'asc',
          since: since?.toISOString()
        }
      );

      for await (const { data, params } of it) {
        for (let index = 0; index < data.length; index++) {
          if (data[index].pull_request) {
            const { reactions } = data[index];
            data[index] = Object.assign(
              await pullRequest(client, { repo: options.repo, number: data[index].number }).then(
                (pr) => pr || Promise.reject(new Error('Pull request not found!'))
              ),
              { reactions }
            );
          }

          for await (const tl of timeline(client, { repo: options.repo, issue: data[index] })) {
            for (const event of tl.data) {
              event._reactions = await _reactions(client, event, options);
            }

            data[index]._events = tl.data;
          }

          data[index]._reactions = await _reactions(client, data[index], options);
        }

        since = data.at(data.length - 1)?.updated_at || since;

        yield { data, params: { ...params, page: 0, since } };
      }
    }
  };
}
