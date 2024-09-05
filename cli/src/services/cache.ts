import { Actor, ActorSchema, PassThroughService, Service } from '@/core/index.js';

import { Cache, MultiCache } from 'cache-manager';

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
 * A service that caches responses from the underlying service.
 */
export class CacheService extends PassThroughService {
  constructor(
    service: Service,
    private cache: Cache | MultiCache
  ) {
    super(service);
  }

  override user(loginOrId: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  override user(loginOrId: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;
  override async user(loginOrId: any, opts?: { byLogin: boolean }): Promise<any> {
    const arr = Array.isArray(loginOrId) ? loginOrId : [loginOrId];

    const cachedResults = await Promise.all(
      arr.map(async (id) => {
        const user = await this.cache.get<string>(id);
        if (user) return ActorSchema.parse(JSON.parse(await decompress(Buffer.from(user, 'base64'))));
        return id;
      })
    );

    const notFound = cachedResults.filter((id) => typeof id === 'string');
    const notFoundResult = await super.user(notFound, opts);

    const result = await Promise.all(
      cachedResults.map(async (id) => {
        if (typeof id === 'string') {
          const user = notFoundResult.find((u) => u?.id === id);
          if (user) this.cache.set(id, (await compress(JSON.stringify(user))).toString('base64'));
          return user || null;
        }
        return id;
      })
    );

    return Array.isArray(loginOrId) ? result : result[0];
  }
}
