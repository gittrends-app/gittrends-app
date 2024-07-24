import { OctokitResponse } from '@octokit/types';
import consola from 'consola';
import stringifyObject from 'stringify-object';
import { ZodError } from 'zod';
import { clients } from '../clients.js';
import { IterableEndpoints, ResourceEndpoints } from './endpoints.js';

export type PageableParams = {
  page?: number | string;
  per_page?: number;
  [key: string]: unknown;
};

export type IterableResource<T, P extends object = object> = AsyncIterable<{
  data: T[];
  params: PageableParams & P;
}>;

type ResourceParams<R extends keyof IterableEndpoints> = {
  url: R;
  parser: (...args: any[]) => IterableEndpoints[R]['result'];
  metadata?: object;
};

/**
 * Get a resource
 *
 */
export async function request<K extends keyof ResourceEndpoints>(
  resource: {
    url: K;
    parser: (...args: any[]) => ResourceEndpoints[K]['result'];
    metadata?: object;
  },
  params: ResourceEndpoints[K]['params']
): Promise<ResourceEndpoints[K]['result'] | undefined> {
  return clients.rest
    .request<string>(resource.url, { ...params })
    .then((response: OctokitResponse<ResourceEndpoints[K]['response']>) => {
      if (response.status !== 200) throw new Error(`Failed to get ${resource.url} - ${response.status}`);
      return resource.parser({ ...response.data, ...resource.metadata });
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
  resource: ResourceParams<R>,
  params: IterableEndpoints[R]['params']
): IterableResource<IterableEndpoints[R]['result']> {
  const { page, per_page: perPage, ...requestParams } = params;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(Number(page) || 1, 1);

      do {
        const response: OctokitResponse<IterableEndpoints[R]['response']> = await clients.rest.request<string>(
          resource.url,
          {
            page: currentPage,
            per_page: perPage || 100,
            ...requestParams
          }
        );

        yield {
          data: response.data.map((data: Record<string, any>) => {
            try {
              return resource.parser({
                ...data,
                ...resource.metadata
              });
            } catch (error: any) {
              if (error instanceof ZodError)
                consola.error(`${error.message || error}: `, stringifyObject(data, { indent: '  ' }));
              throw error;
            }
          }),
          params: { ...requestParams, page: currentPage++, per_page: perPage || 100 }
        };

        if (response.data.length < (perPage || 100)) break;
      } while (true);
    }
  };
}
