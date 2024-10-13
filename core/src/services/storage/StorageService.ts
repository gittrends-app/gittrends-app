import omit from 'lodash/omit.js';
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
import { Iterable, PageableParams, Service, ServiceCommitsParams, ServiceResourceParams } from '../Service.js';
import { StorageFactory } from './StorageFactory.js';

/**
 * A service that interacts with the Github API and stores the results in a storage.
 */
export class StorageService implements Service {
  private readonly service: Service;

  public readonly storage: StorageFactory;

  /**
   * Creates a new StorageService.
   * @param service The underlying service.
   * @param storage The storage factory.
   */
  constructor(service: Service, storage: StorageFactory) {
    this.service = service;
    this.storage = storage;
  }

  search(total: number, opts?: PageableParams): Iterable<Repository> {
    const repoStorage = this.storage.create('Repository');
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

    const userStorage = this.storage.create('Actor');

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
    const repoStorage = this.storage.create('Repository');

    let repo = await repoStorage.get({ id: name ? `${ownerOrId}/${name}` : ownerOrId });

    if (repo && repo.updated_at) return repo;

    repo = await this.service.repository(ownerOrId, name);
    if (repo) await repoStorage.save(repo, true);

    return repo;
  }

  watchers(opts: ServiceResourceParams & { resume?: boolean }): Iterable<Watcher> {
    return this.resource('watchers', opts);
  }

  stargazers(opts: ServiceResourceParams & { resume?: boolean }): Iterable<Stargazer> {
    return this.resource('stargazers', opts);
  }

  discussions(opts: ServiceResourceParams & { resume?: boolean }): Iterable<Discussion> {
    return this.resource('discussions', opts);
  }

  tags(opts: ServiceResourceParams & { resume?: boolean }): Iterable<Tag> {
    return this.resource('tags', opts);
  }

  releases(opts: ServiceResourceParams & { resume?: boolean }): Iterable<Release> {
    return this.resource('releases', opts);
  }

  commits(opts: ServiceCommitsParams & { resume?: boolean }): Iterable<Commit> {
    return this.resource('commits', opts);
  }

  issues(opts: ServiceResourceParams & { resume?: boolean }): Iterable<Issue> {
    return this.resource('issues', opts);
  }

  pull_requests(opts: ServiceResourceParams & { resume?: boolean }): Iterable<PullRequest> {
    return this.resource('pull_requests', opts);
  }

  private resource(name: string, opts: ServiceResourceParams & { resume?: boolean }): Iterable<any> {
    let resourceName;

    if (name === 'watchers') resourceName = 'Watcher';
    else if (name === 'stargazers') resourceName = 'Stargazer';
    else if (name === 'discussions') resourceName = 'Discussion';
    else if (name === 'tags') resourceName = 'Tag';
    else if (name === 'releases') resourceName = 'Release';
    else if (name === 'commits') resourceName = 'Commit';
    else if (name === 'issues') resourceName = 'Issue';
    else if (name === 'pull_requests') resourceName = 'PullRequest';
    else throw new Error(`Unknown resource: ${name}`);

    const metadataStorage = this.storage.create('Metadata');
    const resourceStorage = this.storage.create<RepositoryNode>(resourceName);

    const { service } = this;

    return {
      [Symbol.asyncIterator]: async function* () {
        let params = opts;

        if (!params.cursor) {
          const [meta] = await metadataStorage.find({ id: `${params.repository}_${resourceName}` });

          if (meta) {
            let page = 0;

            while (!params.resume) {
              const resources = await resourceStorage.find({ repository: params.repository } as RepositoryNode, {
                limit: opts.per_page || 100,
                offset: page++ * (opts.per_page || 100)
              });

              if (resources.length) yield { data: resources, metadata: { has_more: true, ...meta } };
              else break;
            }

            params = {
              ...omit(meta, ['id', '__typename', 'per_page']),
              per_page: opts.per_page
            } as ServiceResourceParams;
          }
        }

        for await (const res of service[name](params)) {
          if (res.data.length) {
            await resourceStorage.save(res.data as unknown as RepositoryNode);
            await metadataStorage.save(
              { id: `${opts.repository}_${resourceName}`, __typename: 'Metadata', ...params, ...res.metadata },
              true
            );
            yield res;
          } else {
            yield { data: [], metadata: { ...res.metadata, has_more: false } };
            return;
          }
        }
      }
    };
  }
}
