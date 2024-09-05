import camelCase from 'lodash/camelCase.js';
import omit from 'lodash/omit.js';
import upperFirst from 'lodash/upperFirst.js';
import pluralize from 'pluralize';
import { Actor } from '../../entities/Actor.js';
import { RepositoryNode } from '../../entities/base/RepositoryNode.js';
import { Commit } from '../../entities/Commit.js';
import { Discussion } from '../../entities/Discussion.js';
import { Issue } from '../../entities/Issue.js';
import { PullRequest } from '../../entities/PullRequest.js';
import { Release } from '../../entities/Release.js';
import { Repository } from '../../entities/Repository.js';
import { Stargazer } from '../../entities/Stargazer.js';
import { Tag } from '../../entities/Tag.js';
import { Watcher } from '../../entities/Watcher.js';
import { PassThroughService } from '../passthrough.js';
import { Iterable, Service, ServiceCommitsParams, ServiceResourceParams } from '../service.js';
import { StorageFactory } from './storage.js';

/**
 * A service that interacts with the Github API and stores the results in a storage.
 */
export class StorageService extends PassThroughService {
  public readonly storage: StorageFactory;

  constructor(service: Service, storage: StorageFactory) {
    super(service);
    this.storage = storage;
  }

  search(total: number, opts?: { first?: number }): Iterable<Repository> {
    const repoStorage = this.storage.nodeStorage('Repository');
    const it = this.service.search(total, opts);

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const res of it) {
          if (res.data.length) await repoStorage.save(res.data);
          yield res;
        }
      }
    };
  }

  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;
  async user(id: string | string[], opts?: { byLogin: boolean }): Promise<any> {
    const arr = Array.isArray(id) ? id : [id];

    const userStorage = this.storage.nodeStorage('Actor');

    const cachedResult = await Promise.all(
      arr.map(async (id) => {
        const user = await userStorage.get({ id: id });
        if (user && user.updated_at) return user;
        else return id;
      })
    );

    const notFound = cachedResult.filter((id) => typeof id === 'string');
    const notFOundResult = await this.service.user(notFound, opts);

    const result = cachedResult.map((id) => {
      if (typeof id === 'string') {
        const user = notFOundResult.find((u) => u?.id === id);
        if (user) userStorage.save(user, true);
        return user || null;
      }
      return id;
    });

    return Array.isArray(id) ? result : result[0];
  }

  async repository(ownerOrId: string, name?: string): Promise<Repository | null> {
    const repoStorage = this.storage.nodeStorage('Repository');

    let repo = await repoStorage.get({ id: name ? `${ownerOrId}/${name}` : ownerOrId });

    if (repo && repo.updated_at) return repo;

    repo = await this.service.repository(ownerOrId, name);
    if (repo) await repoStorage.save(repo, true);

    return repo;
  }

  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: 'releases', opts: ServiceResourceParams): Iterable<Release>;
  resource(name: 'commits', opts: ServiceCommitsParams): Iterable<Commit>;
  resource(name: 'issues', opts: ServiceResourceParams): Iterable<Issue>;
  resource(name: 'pull_requests', opts: ServiceResourceParams): Iterable<PullRequest>;
  resource(name: string, opts: ServiceResourceParams): Iterable<any> {
    const resourceName = upperFirst(camelCase(pluralize.singular(name)));

    const metadataStorage = this.storage.nodeStorage('Metadata');
    const resourceStorage = this.storage.repoNodeStorage<RepositoryNode>(resourceName);

    const { service } = this;

    return {
      [Symbol.asyncIterator]: async function* () {
        let params = opts;

        if (!params.cursor) {
          const [meta] = await metadataStorage.find({ id: params.repository, __typename: resourceName });

          if (meta) {
            let page = 0;
            const limit = meta.first ? Number(meta.first) : 100;

            while (!params.resume) {
              const resources = await resourceStorage.find({ repository: params.repository } as RepositoryNode, {
                limit,
                offset: page++ * limit
              });

              if (resources.length) yield { data: resources, params: { has_more: true, ...meta } };
              else break;
            }

            params = omit(meta, ['id', '__typename']) as ServiceResourceParams;
          }
        }

        for await (const res of service.resource(name as any, params)) {
          if (res.data.length) {
            await resourceStorage.save(res.data as unknown as RepositoryNode);
            await metadataStorage.save(
              { id: opts.repository, __typename: resourceName, ...params, ...res.params },
              true
            );
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
