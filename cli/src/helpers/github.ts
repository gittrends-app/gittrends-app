import { GithubClient } from '@/core/index.js';
import fetchRetry from 'fetch-retry';
import env from './env.js';

/**
 * Github client.
 */
export default new GithubClient(env.GITHUB_API_BASE_URL, {
  apiToken: env.GITHUB_API_TOKEN,
  disableThrottling: env.GITHUB_DISABLE_THROTTLING,
  fetcher: fetchRetry(fetch, {
    retries: 10,
    retryOn: [502],
    retryDelay: (attempt) => Math.pow(2, attempt) * Math.floor(Math.random() * 1000)
  })
});
