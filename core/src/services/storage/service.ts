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

  private readonly expiresIn: number;
  private readonly resume: boolean;

  constructor(service: Service, storage: Storage, props?: { expiresIn?: number; resume?: boolean }) {
    super(service);
    this.storage = storage;
    this.expiresIn = props?.expiresIn ?? Infinity;
    this.resume = props?.resume ?? false;
  }

  private isUpdated(date: Date): boolean {
    return dayjs().diff(date, 'days', true) < this.expiresIn;
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

    const { service, resume } = this;

    return {
      [Symbol.asyncIterator]: async function* () {
        const params = { ...opts };

        if (!params.page) {
          const meta = await metadataStorage.get({ entity: Entity.name, entity_id: params.repo.node_id });

          const coreMeta = pick(meta, ['page', 'per_page', 'since', 'until']);

          if (meta) {
            let page = 0;
            const limit = meta.per_page ? Number(meta.per_page) : 100;

            while (!resume) {
              const resources = await resourceStorage.find(
                { _repository: params.repo.node_id },
                { limit, offset: page++ * limit }
              );

              if (resources.length) yield { data: resources, params: { has_more: true, ...coreMeta } };
              else break;
            }

            Object.assign(params, coreMeta, { per_page: opts.per_page ?? coreMeta.per_page });
          }
        }

        const resumable = [Stargazer, Issue, Commit].includes(Entity as any);

        if (!resumable) params.page = 0;

        for await (const res of service.resource(Entity, params)) {
          if (!resumable) {
            res.data = (
              await Promise.all(
                res.data.map((r) => resourceStorage.count({ _id: r._id }).then((count) => (count === 0 ? r : null)))
              )
            ).filter((r) => r !== null);
          }

          if (res.data.length) await resourceStorage.save(res.data);

          await metadataStorage.save(
            new Metadata({
              entity: Entity,
              repository: params.repo.node_id,
              ...res.params,
              updated_at: res.params.has_more ? undefined : new Date()
            }),
            true
          );

          if (res.data.length > 0) {
            yield res;
          } else {
            yield { data: [], params: { ...res.params, has_more: false } };
            return;
          }
        }
      }
    };
  }
}
