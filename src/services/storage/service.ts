import { Class } from 'type-fest';
import { Issue, Metadata, Repository, RepositoryResource, User } from '../../entities/Entity.js';
import { IterableEntity, ResourceParams, SearchOptions, Service } from '../service.js';
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
  ): IterableEntity<Repository, { page: number; per_page: number; count: number } & SearchOptions> {
    return this.service.search(total, params);
  }

  async user(loginOrId: string | number): Promise<User | null> {
    const user = await this.service.user(loginOrId);
    if (user) {
      await this.storage.create(User).save(user, true);
      await this.storage.create(Metadata).save(new Metadata({ entity: user._entityname, entity_id: user._id }), true);
    }
    return user;
  }

  async repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    const repo = await this.service.repository(ownerOrId, name);
    if (repo) {
      await this.storage.create(Repository).save(repo, true);
      await this.storage.create(Metadata).save(new Metadata({ entity: repo._entityname, entity_id: repo._id }), true);
    }
    return repo;
  }

  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): IterableEntity<Issue, { since?: Date }>;
  resource(Entity: Class<RepositoryResource>, opts: ResourceParams): IterableEntity<RepositoryResource> {
    const storage = this.storage;
    const it = this.service.resource(Entity, opts);

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const res of it) {
          if (res.data.length) {
            await storage.create(Entity).save(res.data);
            await storage
              .create(Metadata)
              .save(
                new Metadata({ entity: Entity.prototype._entityname, entity_id: opts.repo.node_id, ...res.params }),
                true
              );
          }
          yield res;
        }
      }
    };
  }
}
