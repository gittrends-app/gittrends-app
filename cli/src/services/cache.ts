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
  override user(loginOrId: any, opts?: { byLogin: boolean }): Promise<any> {
    const arr = Array.isArray(loginOrId) ? loginOrId : [loginOrId];

    const result = Promise.all(
      arr.map(async (id) => {
        const user = await this.cache.get<string>(id);
        if (user) return ActorSchema.parse(JSON.parse(await decompress(Buffer.from(user, 'base64'))));

        return super.user(id, opts).then(async (data) => {
          const compressed = await compress(JSON.stringify(data));
          if (data) this.cache.set(id, compressed.toString('base64'));
          return data;
        });
      })
    );

    return Array.isArray(loginOrId) ? result : result.then((data) => data[0]);
  }
}
