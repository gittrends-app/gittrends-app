import { PassThroughService, Service, User } from '@/core/index.js';

import { Cache, MultiCache } from 'cache-manager';

import { promisify } from 'util';
import { gunzip, gzip } from 'zlib';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 *
 */
async function compress(text: string): Promise<Buffer> {
  return gzipAsync(text);
}

/**
 *
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

  override user(loginOrId: string | number): Promise<User | null>;
  override user(loginOrId: string[] | number[]): Promise<(User | null)[]>;
  override user(loginOrId: any): Promise<User | null> | Promise<(User | null)[]> {
    const arr = Array.isArray(loginOrId) ? loginOrId : [loginOrId];

    const result = Promise.all(
      arr.map(async (id) => {
        const user = await this.cache.get<string>(id);
        if (user) return User.create(JSON.parse(await decompress(Buffer.from(user, 'base64'))));

        return super.user(id).then(async (data) => {
          const compressed = await compress(JSON.stringify(data));
          if (data) this.cache.set(id, compressed.toString('base64'));
          return data;
        });
      })
    );

    return Array.isArray(loginOrId) ? result : result.then((data) => data[0]);
  }
}
