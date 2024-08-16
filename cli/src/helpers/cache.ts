import { sqliteStore } from '@resolid/cache-manager-sqlite';
import { caching, MultiCache, multiCaching } from 'cache-manager';
import { existsSync, mkdirSync } from 'fs';
import env from './env.js';

/**
 *  Create a cache manager instance.
 */
export async function createCache(): Promise<MultiCache> {
  if (!existsSync('./.cache')) mkdirSync('./.cache');

  const sqliteCache = await caching(
    sqliteStore({ sqliteFile: './.cache/caching.sqlite', cacheTableName: 'caches', ttl: env.CACHE_TTL })
  );

  const memoryCache = await caching('memory', { max: env.CACHE_SIZE, ttl: env.CACHE_TTL });

  return multiCaching([memoryCache, sqliteCache]);
}
