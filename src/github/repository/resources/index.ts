import {
  Issue,
  PullRequest,
  Reactable,
  Reaction,
  Release,
  RepositoryResource,
  Tag,
  TimelineEvent,
  Watcher
} from '../../../entities/Entity.js';
import { IterableEndpoints } from '../../_requests_/endpoints.js';
import { IterableResource, iterator, PageableParams, request } from '../../_requests_/index.js';
import stargazers from './stargazers.js';

type RepoParam = { repo: { id: number; node_id: string } };
type ResourcesParams = PageableParams & RepoParam;

/**
 * Get a pull request by number.
 */
function pullRequest(params: RepoParam & { number: number }) {
  return request(
    {
      url: 'GET /repositories/:repo/pulls/:number',
      Entity: PullRequest,
      metadata: { repository: params.repo.node_id }
    },
    { repo: params.repo.id, number: params.number }
  );
}

/**
 * Get the tags of a repository by its id
 */
function watchers(options: ResourcesParams) {
  return iterator(
    {
      url: 'GET /repositories/:repo/subscribers',
      Entity: Watcher,
      metadata: { repository: options.repo.node_id }
    },
    { ...options, repo: options.repo.id }
  );
}

/**
 * Get the tags of a repository by its id
 */
function tags(options: ResourcesParams) {
  return iterator(
    {
      url: 'GET /repositories/:repo/tags',
      Entity: Tag,
      metadata: { repository: options.repo.node_id }
    },
    { ...options, repo: options.repo.id }
  );
}

/**
 * Get the releases of a repository by its id
 */
function releases(options: ResourcesParams) {
  return {
    [Symbol.asyncIterator]: async function* () {
      const it = iterator(
        {
          url: 'GET /repositories/:repo/releases',
          Entity: Release,
          metadata: { repository: options.repo.node_id }
        },
        { ...options, repo: options.repo.id }
      );

      for await (const { data, params } of it) {
        for (const release of data) {
          release._reactions = await _reactions(release, options);
        }

        yield { data, params };
      }
    }
  };
}

/**
 *
 */
async function _reactions<T extends Reactable & RepositoryResource>(
  entity: T,
  options: ResourcesParams
): Promise<Reaction[]> {
  const reactions: Reaction[] = [];

  if (entity._hasReactions) {
    let reactionsIt: IterableResource<Reaction> | undefined;

    switch (true) {
      case entity instanceof Release:
        reactionsIt = iterator(
          {
            url: 'GET /repositories/:repo/releases/:release/reactions',
            Entity: Reaction,
            metadata: {
              repository: entity._repository,
              reactable_name: entity.constructor.name,
              reactable_id: entity._id
            }
          },
          { ...options, repo: options.repo.id, release: entity.id }
        );
        break;
      case entity instanceof Issue:
      case entity instanceof PullRequest:
        reactionsIt = iterator(
          {
            url: 'GET /repositories/:repo/issues/:number/reactions',
            Entity: Reaction,
            metadata: {
              repository: entity._repository,
              reactable_name: entity.constructor.name,
              reactable_id: entity._id
            }
          },
          { ...options, repo: options.repo.id, number: entity.number }
        );
        break;
      case entity instanceof TimelineEvent: {
        let url: keyof IterableEndpoints;

        if (entity.event === 'commented') url = 'GET /repositories/:repo/issues/comments/:id/reactions';
        else if (entity.event === 'reviewed') url = 'GET /repositories/:repo/pulls/comments/:id/reactions';
        else throw new Error(`Unhandled timeline event: ${entity.event}`);

        reactionsIt = iterator(
          {
            url,
            Entity: Reaction,
            metadata: {
              repository: entity._repository,
              reactable_name: entity.constructor.name,
              reactable_id: entity._id
            }
          },
          { ...options, repo: options.repo.id, id: (entity.data as any).id }
        );
        break;
      }

      default:
        throw new Error(`Unhandled reactable type: ${entity.constructor.name}`);
    }

    for await (const { data } of reactionsIt) {
      reactions.push(...data);
    }
  }

  return reactions;
}

/**
 * Get the issues of a repository by its id
 *
 */
function issues(options: ResourcesParams & { since?: Date }): IterableResource<Issue | PullRequest> {
  return {
    [Symbol.asyncIterator]: async function* () {
      const it = iterator(
        {
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
            const pr = await pullRequest({ repo: options.repo, number: issue.number });
            Object.assign(issue, pr);
          }

          for await (const tl of timeline({ repo: options.repo, issue: issue })) {
            for (const event of tl.data) {
              event._reactions = await _reactions(event, options);
            }

            issue.events = tl.data;
          }

          issue._reactions = await _reactions(issue, options);
        }

        yield { data, params };
      }
    }
  };
}

/**
 * Get the timeline of an issue by its id
 */
function timeline({ issue, ...options }: ResourcesParams & { issue: { number: number; node_id: string } }) {
  return iterator(
    {
      url: 'GET /repositories/:repo/issues/:number/timeline',
      Entity: TimelineEvent,
      metadata: { repository: options.repo.node_id, issue: issue.node_id }
    },
    { ...options, repo: options.repo.id, number: issue.number }
  );
}

// Export all functions
export const resources = {
  watchers,
  tags,
  stargazers,
  releases,
  issues,
  pullRequest
} satisfies Record<
  string,
  (...args: any[]) => IterableResource<RepositoryResource> | Promise<RepositoryResource | undefined>
>;
