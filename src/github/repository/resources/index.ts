import { timelineEventSchema } from '../../../entities/events.js';
import { Issue, issueSchema, PullRequest, pullRequestSchema } from '../../../entities/issue.js';
import { releaseSchema } from '../../../entities/release.js';
import { RepositoryResource } from '../../../entities/repository.js';
import { tagSchema } from '../../../entities/tag.js';
import { userSchema } from '../../../entities/user.js';
import { watcherSchema } from '../../../entities/watcher.js';
import { ResourceEndpoints } from '../../endpoints.js';
import { IterableResource, iterator, PageableParams } from '../../iterator.js';
import { request } from '../../request.js';
import stargazers from './stargazers.js';

export type ResourcesParams = PageableParams & {
  repo: number | string;
};

/**
 * Get a pull request by number.
 */
function pullRequest(params: ResourceEndpoints['GET /repositories/:repo/pulls/:number']['params']) {
  return request(
    {
      url: 'GET /repositories/:repo/pulls/:number',
      schema: pullRequestSchema,
      metadata: { __repository: params.repo }
    },
    params
  );
}

/**
 * Get the tags of a repository by its id
 */
function watchers(options: ResourcesParams) {
  return iterator(
    {
      url: 'GET /repositories/:repo/subscribers',
      schema: userSchema.transform((v) =>
        watcherSchema.parse({ user: v, __repository: options.repo })
      ),
      metadata: { __repository: options.repo }
    },
    options
  );
}

/**
 * Get the tags of a repository by its id
 */
function tags(options: ResourcesParams) {
  return iterator(
    {
      url: 'GET /repositories/:repo/tags',
      schema: tagSchema,
      metadata: { __repository: options.repo }
    },
    options
  );
}

/**
 * Get the releases of a repository by its id
 */
function releases(options: ResourcesParams) {
  return iterator(
    {
      url: 'GET /repositories/:repo/releases',
      schema: releaseSchema,
      metadata: { __repository: options.repo }
    },
    options
  );
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
          schema: issueSchema,
          metadata: { __repository: options.repo }
        },
        {
          ...options,
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
            const events = tl.data.map((e) => ({ ...e, __issue: issue.id }));
            if (Array.isArray(issue.__timeline)) issue.__timeline.push(...events);
            else issue.__timeline = events;
          }
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
      schema: timelineEventSchema,
      metadata: { __repository: options.repo, __issue: issue }
    },
    { ...options, number: issue }
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
