import { GetResponseDataTypeFromEndpointMethod, OctokitResponse } from '@octokit/types';
import { ZodSchema } from 'zod';
import { Issue, issueSchema } from '../../../entities/issue.js';
import { Release, releaseSchema } from '../../../entities/release.js';
import { Tag, tagSchema } from '../../../entities/tag.js';
import { userSchema } from '../../../entities/user.js';
import { Watcher, watcherSchema } from '../../../entities/watcher.js';
import { clients } from '../../clients.js';
import stargazers from './stargazers.js';

export type ResourcesParams = {
  repo: number | string;
  page?: number | string;
  per_page?: number;
};

export type IterableResource<T> = AsyncIterable<{
  data: T[];
  metadata: ResourcesParams;
}>;

type Endpoints = {
  'GET /repositories/:repo/subscribers': {
    response: GetResponseDataTypeFromEndpointMethod<
      typeof clients.rest.activity.listWatchersForRepo
    >;
    result: Watcher;
    params: ResourcesParams;
  };
  'GET /repositories/:repo/tags': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.listTags>;
    result: Tag;
    params: ResourcesParams;
  };
  'GET /repositories/:repo/releases': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.listReleases>;
    result: Release;
    params: ResourcesParams;
  };
  'GET /repositories/:repo/issues': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.issues.list>;
    result: Issue;
    params: ResourcesParams & {
      state: 'open' | 'closed' | 'all';
      sort: 'created' | 'updated';
      direction: 'asc' | 'desc';
      since?: string;
    };
  };
};

/**
 * Get resources of a repository
 *
 * @param url - The URL of the endpoint.
 * @param schema - The schema to parse the data.
 * @param params - The properties to pass to the function.
 *
 */
function resourceIterator<R extends keyof Endpoints>(
  resource: { url: R; schema: ZodSchema },
  params: Endpoints[R]['params']
): IterableResource<Endpoints[R]['result']> {
  const { repo, page, per_page: perPage, ...requestParams } = params;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(Number(page) || 1, 1);

      do {
        const response: OctokitResponse<Endpoints[R]['response']> =
          await clients.rest.request<string>(resource.url, {
            repo,
            page: currentPage,
            per_page: perPage || 100,
            ...requestParams
          });

        yield {
          data: response.data.map((data: Record<string, any>) =>
            resource.schema.parse({ ...data, __repository: repo })
          ),
          metadata: { repo, page: currentPage++ }
        };

        if (response.data.length < 100) break;
      } while (true);
    }
  };
}

/**
 * Get the tags of a repository by its id
 */
function watchers(options: ResourcesParams) {
  return resourceIterator(
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
  return resourceIterator({ url: 'GET /repositories/:repo/tags', schema: tagSchema }, options);
}

/**
 * Get the releases of a repository by its id
 */
function releases(options: ResourcesParams) {
  return resourceIterator(
    { url: 'GET /repositories/:repo/releases', schema: releaseSchema },
    options
  );
}

/**
 * Get the issues of a repository by its id
 *
 */
function issues(options: ResourcesParams & { since?: Date }) {
  return resourceIterator(
    { url: 'GET /repositories/:repo/issues', schema: issueSchema },
    {
      ...options,
      state: 'all',
      sort: 'updated',
      direction: 'asc',
      since: options.since?.toISOString()
    }
  );
}

// Export all functions
export const resources = { watchers, tags, stargazers, releases, issues } satisfies Record<
  string,
  (options: ResourcesParams) => IterableResource<any>
>;
