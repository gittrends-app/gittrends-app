import { GetResponseDataTypeFromEndpointMethod, OctokitResponse } from '@octokit/types';
import { ZodSchema } from 'zod';
import { Release, releaseSchema } from '../../../entities/release.js';
import { Tag, tagSchema } from '../../../entities/tag.js';
import { userSchema } from '../../../entities/user.js';
import { Watcher, watcherSchema } from '../../../entities/watcher.js';
import { rest } from '../../client.js';
import stargazers from './stargazers.js';

export type ResourcesParams = {
  repo: number | string;
  page?: number | string;
};

export type IterableResource<T> = AsyncIterable<{
  data: T[];
  metadata: ResourcesParams;
}>;

type Endpoints = {
  'GET /repositories/:repo/subscribers': {
    response: GetResponseDataTypeFromEndpointMethod<typeof rest.activity.listWatchersForRepo>;
    result: Watcher;
  };
  'GET /repositories/:repo/tags': {
    response: GetResponseDataTypeFromEndpointMethod<typeof rest.repos.listTags>;
    result: Tag;
  };
  'GET /repositories/:repo/releases': {
    response: GetResponseDataTypeFromEndpointMethod<typeof rest.repos.listReleases>;
    result: Release;
  };
};

/**
 * Get resources of a repository
 *
 * @param url - The URL of the endpoint.
 * @param schema - The schema to parse the data.
 * @param options - The properties to pass to the function.
 *
 */
function resourceIterator<R extends keyof Endpoints>(
  resource: { url: R; schema: ZodSchema },
  options: ResourcesParams
): IterableResource<Endpoints[R]['result']> {
  const { repo, page } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(Number(page) || 1, 1);

      do {
        const response: OctokitResponse<Endpoints[R]['response']> = await rest.request<string>(
          resource.url,
          {
            repo,
            per_page: 100,
            page: currentPage
          }
        );

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
export function watchers(options: Parameters<typeof resourceIterator>[1]) {
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
export function tags(options: Parameters<typeof resourceIterator>[1]) {
  return resourceIterator({ url: 'GET /repositories/:repo/tags', schema: tagSchema }, options);
}

/**
 * Get the releases of a repository by its id
 */
export function releases(options: Parameters<typeof resourceIterator>[1]) {
  return resourceIterator(
    { url: 'GET /repositories/:repo/releases', schema: releaseSchema },
    options
  );
}

// Export all functions
export default { watchers, tags, stargazers, releases } satisfies Record<
  string,
  (options: Parameters<typeof resourceIterator>[1]) => IterableResource<any>
>;
