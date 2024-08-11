import { sqliteStore } from '@resolid/cache-manager-sqlite';
import { caching, MultiCache, multiCaching } from 'cache-manager';
import { existsSync, mkdirSync } from 'fs';

/**
 *  Create a cache manager instance.
 */
export async function createCache(): Promise<MultiCache> {
  const ttl = 1000 * 60 * 60 * 24 * 7;

  if (!existsSync('./.cache')) mkdirSync('./.cache');

  const sqliteCache = await caching(
    sqliteStore({ sqliteFile: './.cache/caching.sqlite', cacheTableName: 'caches', ttl })
  );

  const memoryCache = await caching('memory', { max: 250000, ttl });

  return multiCaching([memoryCache, sqliteCache]);
}
