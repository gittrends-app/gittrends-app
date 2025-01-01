import { Cache } from '@gittrends-app/core';
import KeyvBrotli from '@keyv/compress-brotli';
import { KeyvSqlite } from '@keyv/sqlite';
import { Cache as CacheManager, createCache as createCacheManager } from 'cache-manager';
import { CacheableMemory } from 'cacheable';
import { existsSync, mkdirSync } from 'fs';
import { Keyv } from 'keyv';
import { constants } from 'zlib';
import env from './env.js';

/**
 * A cache implementation for the CLI.
 */
class CliCache implements Cache {
  constructor(private base: CacheManager) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.base.get<T>(key);
    return data || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.base.set(key, value, env.CACHE_TTL);
  }

  async remove(key: string): Promise<void> {
    await this.base.del(key);
  }

  async clear(): Promise<void> {
    await this.base.clear();
  }
}

/**
 *  Create a cache manager instance.
 */
export async function createCache(): Promise<Cache> {
  if (!existsSync('./.cache')) mkdirSync('./.cache');

  return new CliCache(
    createCacheManager({
      stores: [
        //  High performance in-memory cache with LRU and TTL
        new Keyv({
          store: new CacheableMemory({ lruSize: env.CACHE_SIZE }),
          compression: new KeyvBrotli({
            compressOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MIN_QUALITY } }
          })
        }),
        //  Sqlite Store
        new Keyv({
          store: new KeyvSqlite({ uri: 'sqlite://.cache/caching.sqlite', table: 'caches' }),
          compression: new KeyvBrotli({
            compressOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY } }
          })
        })
      ]
    })
  );
}
