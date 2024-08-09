import { GithubClient } from '@/core/index.js';
import { RedisCache } from '@node-fetch-cache/redis';
import fetchRetry from 'fetch-retry';
import NodeFetchCache, { FileSystemCache, MemoryCache } from 'node-fetch-cache';
import env from './env.js';

/**
 *
 */
function cacheMode() {
  switch (env.CACHE_MODE) {
    case 'memory':
      return new MemoryCache({ ttl: 1000 * 60 * 30 });
    case 'file':
      return new FileSystemCache({ ttl: 1000 * 60 * 60 * 7, cacheDirectory: './.cache' });
    case 'redis':
      return new RedisCache({
        host: env.REDIS_HOST,
        port: env.REDIS_PORT,
        db: env.REDIS_CACHE_DB,
        ttl: 1000 * 60 * 60 * 24 * 7
      });
    default:
      throw new Error('Unknown cache mode');
  }
}

const fetch = NodeFetchCache.create({
  cache: cacheMode(),
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
