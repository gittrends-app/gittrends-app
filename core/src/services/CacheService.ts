import hash from 'object-hash';
import { Actor } from '../entities/Actor.js';
import { Commit } from '../entities/Commit.js';
import { Discussion } from '../entities/Discussion.js';
import { Issue } from '../entities/Issue.js';
import { PullRequest } from '../entities/PullRequest.js';
import { Release } from '../entities/Release.js';
import { Repository } from '../entities/Repository.js';
import { Stargazer } from '../entities/Stargazer.js';
import { Tag } from '../entities/Tag.js';
import { Watcher } from '../entities/Watcher.js';
import { Iterable, PageableParams, Service, ServiceCommitsParams, ServiceResourceParams } from './Service.js';

/**
 * Represents a mechanism for caching data.
 */
export interface Cache {
  /**
   * Retrieves an item from the cache.
   * @param key The key of the item to retrieve.
   * @returns The cached item or null if not found.
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Stores an item in the cache.
   * @param key The key of the item to store.
   * @param value The value of the item to store.
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Removes an item from the cache.
   * @param key The key of the item to remove.
   */
  remove(key: string): Promise<void>;

  /**
   * Clears all items from the cache.
   */
  clear(): Promise<void>;
}

/**
 * A service that caches responses from the underlying service.
 */
export class CacheService implements Service {
  private readonly service: Service;
  private readonly cache: Cache;

  constructor(service: Service, cache: Cache) {
    this.service = service;
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

  private generic(res: 'stargazers', opts: object & ServiceResourceParams): Iterable<Stargazer>;
  private generic(res: 'watchers', opts: object & ServiceResourceParams): Iterable<Watcher>;
  private generic(res: 'commits', opts: object & ServiceResourceParams): Iterable<Commit>;
  private generic(res: 'discussions', opts: object & ServiceResourceParams): Iterable<Discussion>;
  private generic(res: 'issues', opts: object & ServiceResourceParams): Iterable<Issue>;
  private generic(res: 'pull_requests', opts: object & ServiceResourceParams): Iterable<PullRequest>;
  private generic(res: 'releases', opts: object & ServiceResourceParams): Iterable<Release>;
  private generic(res: 'tags', opts: object & ServiceResourceParams): Iterable<Tag>;
  private generic<T>(
    res: 'stargazers' | 'watchers' | 'commits' | 'discussions' | 'issues' | 'pull_requests' | 'releases' | 'tags',
    opts: object & ServiceResourceParams
  ): Iterable<T> {
    const { cache, service } = this;

    return {
      async *[Symbol.asyncIterator]() {
        const _opts: ServiceResourceParams = { ...opts };

        let cached: { data: T[]; metadata: any } | null;

        do {
          cached = await cache.get(`${res}:${hash(_opts)}`);
          if (cached) {
            cached.metadata.has_more = true;
            yield cached as any;
            _opts.cursor = cached.metadata.cursor;
          }
        } while (cached !== null);

        for await (const { data, metadata } of service[res](_opts)) {
          cache.set(`${res}:${hash(_opts)}`, { data, metadata });
          yield { data, metadata };
          _opts.cursor = metadata.cursor;
        }
      }
    };
  }

  commits(opts: ServiceCommitsParams): Iterable<Commit, { since?: Date; until?: Date }> {
    return this.generic('commits', opts);
  }

  discussions(opts: ServiceResourceParams): Iterable<Discussion> {
    return this.generic('discussions', opts);
  }

  issues(opts: ServiceResourceParams): Iterable<Issue> {
    return this.generic('issues', opts);
  }

  pull_requests(opts: ServiceResourceParams): Iterable<PullRequest> {
    return this.generic('pull_requests', opts);
  }

  releases(opts: ServiceResourceParams): Iterable<Release> {
    return this.generic('releases', opts);
  }

  tags(opts: ServiceResourceParams): Iterable<Tag> {
    return this.generic('tags', opts);
  }

  stargazers(opts: ServiceResourceParams): Iterable<Stargazer> {
    return this.generic('stargazers', opts);
  }

  watchers(opts: ServiceResourceParams): Iterable<Watcher> {
    return this.generic('watchers', opts);
  }
}
