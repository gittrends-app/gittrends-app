import {
  Entity,
  Issue,
  PullRequest,
  Reaction,
  RepositoryResource,
  schemas,
  TimelineEvent
} from '../../../entities/entity.js';
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
      parser: schemas.pull_request,
      metadata: { __repository: params.repo.node_id }
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
      parser: (data: any) => schemas.watcher({ user: data, __repository: options.repo.node_id })
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
      parser: schemas.tag,
      metadata: { __repository: options.repo.node_id }
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
          parser: schemas.release,
          metadata: { __repository: options.repo.node_id }
        },
        { ...options, repo: options.repo.id }
      );

      for await (const { data, params } of it) {
        for (const release of data) {
          release.reactions = await _reactions(release, options);
        }

        yield { data, params };
      }
    }
  };
}

type Reactable = Entity &
  RepositoryResource & {
    reactions?: any;
    node_id: string;
    id: number;
  };

/**
 *
 */
async function _reactions<T extends Reactable>(
  entity: T,
  options: ResourcesParams
): Promise<Reaction[]> {
  const reactions: Reaction[] = [];

  if (entity.reactions?.total_count > 0) {
    let reactionsIt: IterableResource<Reaction> | undefined;

    switch (entity.__typename) {
      case 'Release':
        reactionsIt = iterator(
          {
            url: 'GET /repositories/:repo/releases/:release/reactions',
            parser: schemas.reaction,
            metadata: {
              __repository: entity.__repository,
              __reactable_name: entity.__typename,
              __reactable_id: entity.node_id
            }
          },
          { ...options, repo: options.repo.id, release: entity.id }
        );
        break;
      case 'Issue':
      case 'PullRequest':
        reactionsIt = iterator(
          {
            url: 'GET /repositories/:repo/issues/:number/reactions',
            parser: schemas.reaction,
            metadata: {
              __repository: entity.__repository,
              __reactable_name: entity.__typename,
              __reactable_id: entity.node_id
            }
          },
          { ...options, repo: options.repo.id, number: (entity as Issue).number }
        );
        break;
      case 'TimelineEvent': {
        let url: keyof IterableEndpoints;

        if ((entity as TimelineEvent).event === 'commented')
          url = 'GET /repositories/:repo/issues/comments/:id/reactions';
        else if ((entity as TimelineEvent).event === 'reviewed')
          url = 'GET /repositories/:repo/pulls/comments/:id/reactions';
        else throw new Error(`Unhandled timeline event: ${(entity as TimelineEvent).event}`);

        reactionsIt = iterator(
          {
            url,
            parser: schemas.reaction,
            metadata: {
              __repository: entity.__repository,
              __reactable_name: entity.__typename,
              __reactable_id: entity.node_id
            }
          },
          { ...options, repo: options.repo.id, id: entity.id }
        );
        break;
      }

      default:
        throw new Error(`Unhandled reactable type: ${entity.__typename}`);
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
function issues(
  options: ResourcesParams & { since?: Date }
): IterableResource<Issue | PullRequest> {
  return {
    [Symbol.asyncIterator]: async function* () {
      const it = iterator(
        {
          url: 'GET /repositories/:repo/issues',
          parser: schemas.issue,
          metadata: { __repository: options.repo.node_id }
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

          for await (const tl of timeline({ repo: options.repo, issue: issue.number })) {
            const events = tl.data.map((e) => ({ ...e, __issue: issue.node_id }));

            for (const event of events) {
              if ((event as any).reactions) {
                (event as Reactable).reactions = await _reactions(event as Reactable, options);
              }
            }

            issue.__timeline = Array.isArray(issue.__timeline)
              ? issue.__timeline.concat(events)
              : events;
          }

          issue.reactions = await _reactions(issue, options);
        }

        yield { data, params };
      }
    }
  };
}

/**
 * Get the timeline of an issue by its id
 */
function timeline({ issue, ...options }: ResourcesParams & { issue: number }) {
  return iterator(
    {
      url: 'GET /repositories/:repo/issues/:number/timeline',
      parser: schemas.timeline_event,
      metadata: { __repository: options.repo.node_id, __issue: issue }
    },
    { ...options, repo: options.repo.id, number: issue }
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
