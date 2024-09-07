import { GithubClient } from '@/core/index.js';
import fetchRetry from 'fetch-retry';
import env from './env.js';

/**
 * A Github client instance.
 */
export default new GithubClient(env.GITHUB_API_BASE_URL, {
  apiToken: env.GITHUB_API_TOKEN,
  fetcher: fetchRetry(fetch, { retries: env.FETCH_RETRIES, retryOn: [502] })
});
