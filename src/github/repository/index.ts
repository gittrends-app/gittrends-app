import get from './get.js';
import watchers from './watchers.js';

export type RepositoryParams = {
  owner: string;
  name: string;
};

export type IterableResource<T, K = Record<string, any>> = AsyncIterable<{
  data: T[];
  metadata: RepositoryParams & { resource: string } & K;
}>;

export default { get, watchers };
