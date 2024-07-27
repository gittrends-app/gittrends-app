import { Class } from 'type-fest';
import { Issue, Metadata, Release, Repository, Stargazer, Tag, User, Watcher } from '../../entities/Entity.js';
import { Iterable, ResourceParams, SearchOptions, Service } from '../service.js';
import { Storage } from './storage.js';

/**
 * Storage service
 */
export class StorageService implements Service {
  private readonly service: Service;
  private readonly storage: Storage;

  constructor(service: Service, storage: Storage) {
    this.service = service;
    this.storage = storage;
  }

  search(
    total: number,
    params?: SearchOptions
  ): Iterable<Repository, { page: number; per_page: number; count: number } & SearchOptions> {
    return this.service.search(total, params);
  }

  async user(loginOrId: string | number): Promise<User | null> {
    const user = await this.service.user(loginOrId);
    if (user) {
      await this.storage.create(User).save(user, true);
      await this.storage.create(Metadata).save(new Metadata({ entity: user }), true);
    }
    return user;
  }

  async repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    const repo = await this.service.repository(ownerOrId, name);
    if (repo) {
      await this.storage.create(Repository).save(repo, true);
      await this.storage.create(Metadata).save(new Metadata({ entity: repo }), true);
    }
    return repo;
  }

  resource(Entity: Class<Tag>, opts: ResourceParams): Iterable<Tag>;
  resource(Entity: Class<Release>, opts: ResourceParams): Iterable<Release>;
  resource(Entity: Class<Stargazer>, opts: ResourceParams): Iterable<Stargazer>;
  resource(Entity: Class<Watcher>, opts: ResourceParams): Iterable<Watcher>;
  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): Iterable<Issue, { since?: Date }>;
  resource(Entity: Class<any>, opts: ResourceParams): Iterable<any> {
    const storage = this.storage;
    const it = this.service.resource(Entity, opts);

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const res of it) {
          if (res.data.length) {
            await storage.create(Entity).save(res.data);
            await storage.create(Metadata).save(
              new Metadata({
                entity: Entity,
                repository: opts.repo.node_id,
                ...res.params,
                updated_at: res.params.has_more ? undefined : new Date()
              }),
              true
            );
          }
          yield res;
        }
      }
    };
  }
}
