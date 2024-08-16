import { GithubClient } from '@/core/index.js';
import fetchRetry from 'fetch-retry';
import pLimit from 'p-limit';
import env from './env.js';

const fetchLimit = function (fetch: typeof global.fetch, limit: number) {
  const limiter = pLimit(limit);
  return (...args: Parameters<typeof fetch>) => limiter(() => fetch(...args));
};

/**
 * Github client.
 */
export default new GithubClient(env.GITHUB_API_BASE_URL, {
  apiToken: env.GITHUB_API_TOKEN,
  disableThrottling: env.GITHUB_DISABLE_THROTTLING,
  fetcher: fetchLimit(
    fetchRetry(fetch, {
      retries: env.FETCH_RETRIES,
      retryOn: [502],
      retryDelay: (attempt) => Math.pow(2, attempt) * Math.floor(Math.random() * 1000)
    }),
    env.FETCH_LIMIT
  )
});
