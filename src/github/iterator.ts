import { OctokitResponse } from '@octokit/types';
import consola from 'consola';
import stringifyObject from 'stringify-object';
import { ZodError, ZodType } from 'zod';
import { clients } from './clients.js';
import { IterableEndpoints } from './endpoints.js';

export type PageableParams = {
  page?: number | string;
  per_page?: number;
  [key: string]: unknown;
};

export type IterableResource<T> = AsyncIterable<{
  data: T[];
  params: PageableParams;
}>;

/**
 * Get resources of a repository
 *
 * @param url - The URL of the endpoint.
 * @param schema - The schema to parse the data.
 * @param params - The properties to pass to the function.
 *
 */
export function iterator<R extends keyof IterableEndpoints>(
  resource: { url: R; schema: ZodType; metadata?: object },
  params: IterableEndpoints[R]['params']
): IterableResource<IterableEndpoints[R]['result']> {
  const { page, per_page: perPage, ...requestParams } = params;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(Number(page) || 1, 1);

      do {
        const response: OctokitResponse<IterableEndpoints[R]['response']> =
          await clients.rest.request<string>(resource.url, {
            mediaType: { previews: ['starfox'] },
            page: currentPage,
            per_page: perPage || 100,
            ...requestParams
          });

        yield {
          data: response.data.map((data: Record<string, any>) => {
            try {
              return resource.schema.parse({
                ...data,
                ...resource.metadata
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
          params: { ...requestParams, page: currentPage++, per_page: perPage || 100 }
        };

        if (response.data.length < (perPage || 100)) break;
      } while (true);
    }
  };
}
