import { GithubClient } from '@/core/index.js';
import fetchRetry from 'fetch-retry';
import NodeFetchCache, { FileSystemCache, MemoryCache } from 'node-fetch-cache';
import env from './env.js';

const fetch = NodeFetchCache.create({
  cache:
    env.CACHE_MODE === 'memory'
      ? new MemoryCache({ ttl: 1000 * 60 * 30 })
      : new FileSystemCache({ ttl: 1000 * 60 * 60 * 7, cacheDirectory: './.cache' }),
  shouldCacheResponse: (response) => /\/users?\//.test(response.url) && response.status === 200
});

export default new GithubClient(env.GITHUB_API_BASE_URL, {
  apiToken: env.GITHUB_API_TOKEN,
  disableThrottling: env.GITHUB_DISABLE_THROTTLING,
  fetcher: fetchRetry(fetch, {
    retries: 10,
    retryOn: [502],
    retryDelay: (attempt) => Math.pow(2, attempt) * Math.floor(Math.random() * 1000)
  })
});
