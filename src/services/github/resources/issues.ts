import { Issue, PullRequest, TimelineEvent } from '../../../entities/Entity.js';
import { IterableEntity } from '../../service.js';
import { GithubClient } from '../client.js';
import { iterator, request } from '../requests/index.js';
import { ResourcesParams } from './index.js';
import reactions from './reactions.js';

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
): IterableEntity<Issue | PullRequest, { since?: Date }> {
  return {
    [Symbol.asyncIterator]: async function* () {
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
          since: options.since?.toISOString()
        }
      );

      for await (const { data, params } of it) {
        for (const issue of data) {
          if (issue.pull_request) {
            const pr = await pullRequest(client, { repo: options.repo, number: issue.number });
            Object.assign(issue, pr);
          }

          for await (const tl of timeline(client, { repo: options.repo, issue: issue })) {
            for (const event of tl.data) {
              event._reactions = await reactions(client, event, options);
            }

            issue.events = tl.data;
          }

          issue._reactions = await reactions(client, issue, options);
        }

        yield { data, params: { ...params, since: options.since } };
      }
    }
  };
}
