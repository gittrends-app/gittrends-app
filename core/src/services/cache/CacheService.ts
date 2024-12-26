import hash from 'object-hash';
import { Actor } from '../../entities/Actor.js';
import { Repository } from '../../entities/Repository.js';
import { PassThroughService } from '../PassThroughService.js';
import { Iterable, PageableParams, Service } from '../Service.js';
import { Cache } from './Cache.js';

/**
 * A service that caches responses from the underlying service.
 */
export class CacheService extends PassThroughService {
  private readonly cache: Cache;

  constructor(service: Service, cache: Cache) {
    super(service);
    this.cache = cache;
  }

  search(total: number, opts?: PageableParams): Iterable<Repository> {
    const { cache, service } = this;

    return {
      async *[Symbol.asyncIterator]() {
        const _opts = { total, ...(opts || {}) };

        let cached: { data: Repository[]; metadata: any } | null;

        do {
          cached = await cache.get(`search:${hash(_opts)}`);
          if (cached) {
            yield cached;
            _opts.total -= cached.data.length;
            _opts.cursor = cached.metadata.cursor;
          }
        } while (cached !== null);

        if (_opts.total > 0) {
          for await (const { data, metadata } of service.search(_opts.total, _opts)) {
            cache.set(`search:${hash(_opts)}`, { data, metadata });
            yield { data, metadata };
            _opts.total -= data.length;
            _opts.cursor = metadata.cursor;
          }
        }
      }
    };
  }

  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;
  async user(id: unknown, opts?: any): Promise<any> {
    const ids = Array.isArray(id) ? id : [id];

    const users = await Promise.all(
      ids.map((i) =>
        this.cache.get<Actor>(`user:${i}`).then((cached) => {
          if (cached) return cached;

          return this.service.user(i, opts).then((user) => {
            if (user) this.cache.set(`user:${i}`, user);
            return user;
          });
        })
      )
    );

    return Array.isArray(id) ? users : users[0];
  }

  async repository(ownerOrId: string, name?: string): Promise<Repository | null> {
    const cacheKey = `repository:${ownerOrId}:${name}`;
    const cached = await this.cache.get<Repository>(cacheKey);
    if (cached) return cached;

    const result = await this.service.repository(ownerOrId, name);
    if (result) await this.cache.set(cacheKey, result);

    return result;
  }
}
