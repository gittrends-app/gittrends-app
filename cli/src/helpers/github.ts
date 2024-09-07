import { GithubClient } from '@/core/index.js';
import fetchRetry from 'fetch-retry';
import pLimit from 'p-limit';
import env from './env.js';

const fetchLimit = function (fetch: typeof global.fetch, limit: number) {
  const limiter = pLimit(limit);
  return (...args: Parameters<typeof fetch>) => limiter(() => fetch(...args));
};

/**
 * A Github client instance.
 */
export default new GithubClient(env.GITHUB_API_BASE_URL, {
  apiToken: env.GITHUB_API_TOKEN,
  fetcher: fetchLimit(fetchRetry(fetch, { retries: env.FETCH_RETRIES, retryOn: [502] }), env.FETCH_LIMIT)
});
