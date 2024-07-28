import dayjs from 'dayjs';
import pick from 'lodash/pick.js';
import { Class } from 'type-fest';
import {
  Issue,
  Metadata,
  Release,
  Repository,
  RepositoryResource,
  Stargazer,
  Tag,
  User,
  Watcher
} from '../../entities/Entity.js';
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
    const metadataStorage = this.storage.create(Metadata);
    const userStorage = this.storage.create(User);

    let user = await userStorage.get(typeof loginOrId === 'string' ? { login: loginOrId } : { id: loginOrId });
    if (user) {
      const meta = await metadataStorage.get({ entity: User.prototype._entityname, entity_id: user._id });
      if (meta?.updated_at && dayjs(Date.now()).diff(meta.updated_at, 'days') < 7) return user;
    }

    user = await this.service.user(loginOrId);
    if (user) {
      await userStorage.save(user, true);
      await metadataStorage.save(new Metadata({ entity: user }), true);
    }

    return user;
  }

  async repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    const metadataStorage = this.storage.create(Metadata);
    const repoStorage = this.storage.create(Repository);

    let repo = await repoStorage.get(
      typeof ownerOrId === 'string' ? { full_name: `${ownerOrId}/${name}` } : { id: ownerOrId }
    );
    if (repo) {
      const meta = await metadataStorage.get({ entity: repo._entityname, entity_id: repo._id });
      if (meta?.updated_at && dayjs(Date.now()).diff(meta.updated_at, 'days') < 7) return repo;
    }

    repo = await this.service.repository(ownerOrId, name);
    if (repo) {
      await repoStorage.save(repo, true);
      await metadataStorage.save(new Metadata({ entity: repo }), true);
    }
    return repo;
  }

  resource(Entity: Class<Tag>, opts: ResourceParams): Iterable<Tag>;
  resource(Entity: Class<Release>, opts: ResourceParams): Iterable<Release>;
  resource(Entity: Class<Stargazer>, opts: ResourceParams): Iterable<Stargazer>;
  resource(Entity: Class<Watcher>, opts: ResourceParams): Iterable<Watcher>;
  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): Iterable<Issue, { since?: Date }>;
  resource(Entity: Class<any>, opts: ResourceParams): Iterable<any> {
    const metadataStorage = this.storage.create(Metadata);
    const resourceStorage = this.storage.create(Entity as Class<RepositoryResource>);

    const service = this.service;

    return {
      [Symbol.asyncIterator]: async function* () {
        const meta = await metadataStorage.get({ entity: Entity.prototype._entityname, entity_id: opts.repo.node_id });

        if (meta) {
          const resources = await resourceStorage.find({ _repository: opts.repo.node_id });
          yield { data: resources, params: { has_more: true, ...pick(meta, ['page', 'per_page', 'since']) } };
          if (!meta.has_more) return;
        }

        const it = service.resource(Entity, opts);

        for await (const res of it) {
          if (res.data.length) {
            await resourceStorage.save(res.data);
            await metadataStorage.save(
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
