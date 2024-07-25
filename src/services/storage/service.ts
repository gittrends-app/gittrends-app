import {
  Issue,
  PullRequest,
  Release,
  Repository,
  RepositoryResource,
  Stargazer,
  Tag,
  User,
  Watcher
} from '../../entities/Entity.js';
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
    if (user) await this.storage.create(User).save(user, true);
    return user;
  }

  async repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    const repo = await this.service.repository(ownerOrId, name);
    if (repo) await this.storage.create(Repository).save(repo, true);
    return repo;
  }

  resource(
    resource: 'issues',
    opts: ResourceParams & { since?: Date }
  ): IterableEntity<Issue | PullRequest, { since?: Date }>;
  resource(resource: 'releases', opts: ResourceParams): IterableEntity<Release>;
  resource(resource: 'stargazers', opts: ResourceParams): IterableEntity<Stargazer>;
  resource(resource: 'tags', opts: ResourceParams): IterableEntity<Tag>;
  resource(resource: 'watchers', opts: ResourceParams): IterableEntity<Watcher>;
  resource(resource: any, opts: ResourceParams): IterableEntity<RepositoryResource> {
    const storage = this.storage;
    const it = this.service.resource(resource, opts);

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const res of it) {
          if (res.data.length) await storage.create(res.data[0].constructor as any).save(res.data);
          yield res;
        }
      }
    };
  }
}
