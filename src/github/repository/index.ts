import get from './get.js';
import watchers from './watchers.js';

export type RepositoryParams = {
  owner: string;
  name: string;
};

export type ResourceIterator<T, K = Record<string, any>> = AsyncIterable<{
  data: T[];
  info: RepositoryParams & { resource: string } & K;
}>;

export default { get, watchers };
