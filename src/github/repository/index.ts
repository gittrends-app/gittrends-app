import get from './get.js';
import watchers from './watchers.js';

export type ResourceIterator<T, K = Record<string, any>> = AsyncIterable<{
  data: T[];
  info: { owner: string; name: string; resource: 'stargazers'; [key: string]: any } & K;
}>;

export default { get, watchers };
