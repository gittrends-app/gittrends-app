import { OctokitResponse } from '@octokit/types';
import { ZodType } from 'zod';
import { clients } from './clients.js';
import { ResourceEndpoints } from './endpoints.js';

/**
 * Get a resource
 *
 */
export async function request<K extends keyof ResourceEndpoints>(
  resource: { url: K; schema: ZodType; metadata?: object },
  params: ResourceEndpoints[K]['params']
): Promise<ResourceEndpoints[K]['result'] | undefined> {
  return clients.rest
    .request<string>(resource.url, { ...params })
    .then((response: OctokitResponse<ResourceEndpoints[K]['response']>) => {
      if (response.status !== 200)
        throw new Error(`Failed to get ${resource.url} - ${response.status}`);
      return resource.schema.parse({ ...response.data, ...resource.metadata });
    })
    .catch((error) => {
      if (error.response.status === 404) return undefined;
      else throw error;
    });
}
