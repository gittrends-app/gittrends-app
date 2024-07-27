import { OctokitResponse } from '@octokit/types';
import { Constructor } from 'type-fest';
import { Iterable } from '../../service.js';
import { GithubClient } from '../client.js';
import { IterableEndpoints, ResourceEndpoints } from './endpoints.js';

/**
 * Get a resource
 *
 */
export async function request<K extends keyof ResourceEndpoints>(
  resource: {
    client: GithubClient;
    url: K;
    Entity: Constructor<ResourceEndpoints[K]['result']>;
    metadata?: object;
  },
  params: ResourceEndpoints[K]['params']
): Promise<ResourceEndpoints[K]['result'] | undefined> {
  return resource.client.rest
    .request<string>(resource.url, { ...params })
    .then((response: OctokitResponse<ResourceEndpoints[K]['response']['data']>) => {
      if (response.status !== 200) throw new Error(`Failed to get ${resource.url} - ${response.status}`);
      return new resource.Entity(response.data, resource.metadata);
    })
    .catch((error) => {
      if (error.response.status === 404) return undefined;
      else throw error;
    });
}

/**
 * Get resources of a repository
 *
 */
export function iterator<R extends keyof IterableEndpoints>(
  resource: {
    client: GithubClient;
    url: R;
    Entity: Constructor<IterableEndpoints[R]['result']>;
    metadata?: ConstructorParameters<Constructor<IterableEndpoints[R]['result']>>[1];
  },
  params: IterableEndpoints[R]['params']
): Iterable<IterableEndpoints[R]['result']> {
  const { repo, page, per_page: perPage, ...requestParams } = params;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(Number(page) || 1, 1);

      do {
        const response: OctokitResponse<IterableEndpoints[R]['response']['data']> =
          await resource.client.rest.request<string>(resource.url, {
            repo,
            page: currentPage,
            per_page: perPage || 100,
            ...requestParams
          });

        yield {
          data: response.data.map((data: Record<string, any>) => {
            return new resource.Entity(data, resource.metadata);
          }),
          params: {
            ...requestParams,
            has_more: response.data.length === (perPage || 100),
            page: currentPage++,
            per_page: perPage || 100
          }
        };

        if (response.data.length < (perPage || 100)) break;
      } while (true);
    }
  };
}
