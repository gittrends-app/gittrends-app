import dayjs from 'dayjs';
import pick from 'lodash/pick.js';
import { Class } from 'type-fest';
import {
  Commit,
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
import { PassThroughService } from '../passthrough.js';
import { Iterable, ResourceParams, SearchOptions, Service } from '../service.js';
import { Storage } from './storage.js';

/**
 * A service that interacts with the Github API and stores the results in a storage.
 */
export class StorageService extends PassThroughService {
  public readonly storage: Storage;

  private readonly validBy: number;

  constructor(service: Service, storage: Storage, props?: { valid_by?: number }) {
    super(service);
    this.storage = storage;

    this.validBy = props?.valid_by ?? 1;
  }

  private isUpdated(date: Date): boolean {
    return dayjs().diff(date, 'days', true) < this.validBy;
  }

  search(
    total: number,
    params?: SearchOptions
  ): Iterable<Repository, { page: number; per_page: number } & SearchOptions> {
    const repoStorage = this.storage.create(Repository);
    const it = this.service.search(total, params);

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const res of it) {
          if (res.data.length) await repoStorage.save(res.data);
          yield res;
        }
      }
    };
  }

  async user(loginOrId: string | number): Promise<User | null>;
  async user(loginOrId: string[] | number[]): Promise<(User | null)[]>;
  async user(id: any): Promise<any> {
    const arr = Array.isArray(id) ? id : [id];

    const metadataStorage = this.storage.create(Metadata);
    const userStorage = this.storage.create(User);

    const result = await Promise.all(
      arr.map(async (loginOrId) => {
        const user = await userStorage.get(typeof loginOrId === 'string' ? { login: loginOrId } : { id: loginOrId });
        if (user) {
          const meta = await metadataStorage.get({ entity: User.name, entity_id: user._id });
          if (meta?.updated_at && this.isUpdated(meta.updated_at)) return user;
        }

        const newUser = await this.service.user(loginOrId);

        if (newUser) {
          await userStorage.save(newUser, true);
          await metadataStorage.save(new Metadata({ entity: newUser }), true);
          return newUser;
        } else if (user) {
          return user;
        }

        return null;
      })
    );

    return Array.isArray(id) ? result : result[0];
  }

  async repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    const metadataStorage = this.storage.create(Metadata);
    const repoStorage = this.storage.create(Repository);

    let repo = await repoStorage.get(
      typeof ownerOrId === 'string' ? { full_name: `${ownerOrId}/${name}` } : { id: ownerOrId }
    );
    if (repo) {
      const meta = await metadataStorage.get({ entity: Repository.name, entity_id: repo._id });
      if (meta?.updated_at && this.isUpdated(meta.updated_at)) return repo;
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
  resource(
    Entity: Class<Commit>,
    opts: ResourceParams & { since?: Date; until?: Date }
  ): Iterable<Commit, { since?: Date; until?: Date }>;
  resource(Entity: Class<any>, opts: ResourceParams): Iterable<any> {
    const metadataStorage = this.storage.create(Metadata);
    const resourceStorage = this.storage.create(Entity as Class<RepositoryResource>);

    const { service } = this;

    const resumable = [Stargazer, Issue, Commit].includes(Entity as any);

    return {
      [Symbol.asyncIterator]: async function* () {
        const params = { ...opts };

        const storedIds: string[] = [];

        if (!params.page) {
          const meta = await metadataStorage.get({ entity: Entity.name, entity_id: params.repo.node_id });

          const coreMeta = pick(meta, ['page', 'per_page', 'since', 'until']);

          if (meta) {
            let page = 0;
            const limit = meta.per_page ? Number(meta.per_page) : 100;

            while (true) {
              const resources = await resourceStorage.find(
                { _repository: params.repo.node_id },
                { limit, offset: page++ * limit }
              );

              storedIds.push(...resources.map((r) => r._id));

              if (resources.length) yield { data: resources, params: { has_more: true, ...coreMeta } };
              else break;
            }

            Object.assign(params, coreMeta);
          }
        }

        if (!resumable) {
          params.page = 0;
        }

        for await (const res of service.resource(Entity, params)) {
          await resourceStorage.save(res.data);
          await metadataStorage.save(
            new Metadata({
              entity: Entity,
              repository: params.repo.node_id,
              ...res.params,
              updated_at: res.params.has_more ? undefined : new Date()
            }),
            true
          );

          if (res.data.filter((r) => !storedIds.includes(r._id)).length === 0) {
            yield { data: [], params: { ...res.params, has_more: false } };
            break;
          }

          yield res;
        }
      }
    };
  }
}
