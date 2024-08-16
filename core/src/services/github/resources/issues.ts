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
        const detailedIssue = await Promise.all(
          data.map(async (d) => {
            if (d.pull_request) {
              d = Object.assign(
                await pullRequest(client, { repo: options.repo, number: d.number }).then(
                  (pr) => pr || Promise.reject(new Error('Pull request not found!'))
                ),
                { reactions: d.reactions }
              );
            }

            for await (const tl of timeline(client, { repo: options.repo, issue: d })) {
              d._events = await Promise.all(
                tl.data.map(async (event) => {
                  event._reactions = await _reactions(client, event, options);
                  return event;
                })
              );
            }

            d._reactions = await _reactions(client, d, options);

            return d;
          })
        );

        since = detailedIssue.at(detailedIssue.length - 1)?.updated_at || since;

        yield { data: detailedIssue, params: { ...params, page: 0, since } };
      }
    }
  };
}
