import { Cache } from '@gittrends-app/core';
import KeyvBrotli from '@keyv/compress-brotli';
import { Cache as CacheManager, createCache as createCacheManager } from 'cache-manager';
import { Keyv } from 'keyv';
import { KeyvFile } from 'keyv-file';
import path from 'path';
import QuickLRU from 'quick-lru';
import { MergeExclusive } from 'type-fest';
import { constants } from 'zlib';
import env from './env.js';

/**
 * A cache implementation for the CLI.
 */
class CliCache implements Cache {
  constructor(
    private base: CacheManager,
    private opts?: { keyValidator?: (k: string) => boolean }
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.base.get<T>(key);
    return data || null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (!this.opts?.keyValidator || this.opts.keyValidator(key)) {
      await this.base.set(key, value);
    }
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
export function createCache(params: MergeExclusive<{ namespace: string }, { resource: 'users' }>): Cache {
  const namespace = (params.namespace || params.resource) as string;

  return new CliCache(
    createCacheManager({
      ttl: env.CACHE_TTL,
      stores: [
        //  In-memory cache with LRU
        new Keyv({
          store: new QuickLRU({ maxSize: env.CACHE_SIZE }),
          compression: new KeyvBrotli({
            compressOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MIN_QUALITY } }
          })
        }),
        //  File Store
        new Keyv({
          store: new KeyvFile({ filename: path.resolve(env.CACHE_DIR, `${namespace}.json`) }),
          compression: new KeyvBrotli({
            compressOptions: { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY } }
          })
        })
      ]
    }),
    {
      keyValidator: params.resource
        ? (k) => {
            if (params.resource === 'users') return k.startsWith('user:') || k.startsWith('users:');
            throw new Error('Invalid resource');
          }
        : undefined
    }
  );
}
