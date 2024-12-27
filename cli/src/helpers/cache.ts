import { Cache } from '@/core/index.js';
import { sqliteStore } from '@resolid/cache-manager-sqlite';
import { caching, MultiCache, multiCaching } from 'cache-manager';
import { existsSync, mkdirSync } from 'fs';
import env from './env.js';

import { promisify } from 'util';
import { gunzip, gzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 *  Compresses a text.
 */
async function compress(text: string): Promise<Buffer> {
  return gzipAsync(text);
}

/**
 *  Decompresses a buffer.
 */
async function decompress(buffer: Buffer): Promise<string> {
  const decompressedBuffer = await gunzipAsync(buffer);
  return decompressedBuffer.toString();
}

/**
 * A cache implementation for the CLI.
 */
class CliCache implements Cache {
  constructor(private base: MultiCache) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.base.get<string>(key);
    if (!data) return null;
    return JSON.parse(await decompress(Buffer.from(data, 'base64')));
  }

  async set<T>(key: string, value: T): Promise<void> {
    await this.base.set(key, (await compress(JSON.stringify(value))).toString('base64'));
  }

  async remove(key: string): Promise<void> {
    await this.base.del(key);
  }

  async clear(): Promise<void> {
    await this.base.reset();
  }
}

/**
 *  Create a cache manager instance.
 */
export async function createCache(): Promise<Cache> {
  if (!existsSync('./.cache')) mkdirSync('./.cache');

  const sqliteCache = await caching(
    sqliteStore({ sqliteFile: './.cache/caching.sqlite', cacheTableName: 'caches', ttl: env.CACHE_TTL })
  );

  const memoryCache = await caching('memory', { max: env.CACHE_SIZE, ttl: env.CACHE_TTL });

  return new CliCache(multiCaching([memoryCache, sqliteCache]));
}
