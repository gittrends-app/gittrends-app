import { OctokitResponse } from '@octokit/types';
import consola from 'consola';
import stringifyObject from 'stringify-object';
import { ZodError, ZodType } from 'zod';
import { timelineEventSchema } from '../../../entities/events.js';
import { Issue, issueSchema, PullRequest, pullRequestSchema } from '../../../entities/issue.js';
import { releaseSchema } from '../../../entities/release.js';
import { tagSchema } from '../../../entities/tag.js';
import { userSchema } from '../../../entities/user.js';
import { watcherSchema } from '../../../entities/watcher.js';
import { clients } from '../../clients.js';
import { IterableEndpoints, ResourceEndpoints } from '../../endpoints.js';
import stargazers from './stargazers.js';

export type ResourcesParams = {
  repo: number | string;
  page?: number | string;
  per_page?: number;
  [key: string]: unknown;
};

export type IterableResource<T> = AsyncIterable<{
  data: T[];
  params: ResourcesParams;
}>;

/**
 * Get a resource of a repository
 *
 */
async function request<K extends keyof ResourceEndpoints>(
  resource: { url: K; schema: ZodType },
  params: ResourceEndpoints[K]['params']
): Promise<ResourceEndpoints[K]['result'] | undefined> {
  return clients.rest
    .request<string>(resource.url, { ...params })
    .then((response: OctokitResponse<ResourceEndpoints[K]['response']>) => {
      if (response.status !== 200)
        throw new Error(`Failed to get ${resource.url} - ${response.status}`);
      return resource.schema.parse({ ...response.data, __repository: params.repo });
    });
}

/**
 * Get a pull request by number.
 */
function pullRequest(params: ResourceEndpoints['GET /repositories/:repo/pulls/:number']['params']) {
  return request(
    { url: 'GET /repositories/:repo/pulls/:number', schema: pullRequestSchema },
    params
  );
}

/**
 * Get resources of a repository
 *
 * @param url - The URL of the endpoint.
 * @param schema - The schema to parse the data.
 * @param params - The properties to pass to the function.
 *
 */
function iterator<R extends keyof IterableEndpoints>(
  resource: { url: R; schema: ZodType },
  params: IterableEndpoints[R]['params']
): IterableResource<IterableEndpoints[R]['result']> {
  const { repo, page, per_page: perPage, ...requestParams } = params;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(Number(page) || 1, 1);

      do {
        const response: OctokitResponse<IterableEndpoints[R]['response']> =
          await clients.rest.request<string>(resource.url, {
            repo,
            page: currentPage,
            per_page: perPage || 100,
            ...requestParams,
            mediaType: {
              previews: ['starfox']
            }
          });

        yield {
          data: response.data.map((data: Record<string, any>) => {
            try {
              return resource.schema.parse({
                ...data,
                __repository: repo,
                __issue: requestParams.number
              });
            } catch (error: any) {
              if (error instanceof ZodError)
                consola.error(
                  `${error.message || error}: `,
                  stringifyObject(data, { indent: '  ' })
                );
              throw error;
            }
          }),
          params: { repo, page: currentPage++, per_page: perPage, ...requestParams }
        };

        if (response.data.length < (perPage || 100)) break;
      } while (true);
    }
  };
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
      )
    },
    options
  );
}

/**
 * Get the tags of a repository by its id
 */
function tags(options: ResourcesParams) {
  return iterator({ url: 'GET /repositories/:repo/tags', schema: tagSchema }, options);
}

/**
 * Get the releases of a repository by its id
 */
function releases(options: ResourcesParams) {
  return iterator({ url: 'GET /repositories/:repo/releases', schema: releaseSchema }, options);
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
        { url: 'GET /repositories/:repo/issues', schema: issueSchema },
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
    { url: 'GET /repositories/:repo/issues/:number/timeline', schema: timelineEventSchema },
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
};
