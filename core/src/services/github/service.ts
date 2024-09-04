/* eslint-disable @typescript-eslint/no-unused-vars */
import { Actor } from '../../entities/Actor.js';
import { Commit } from '../../entities/Commit.js';
import { Discussion } from '../../entities/Discussion.js';
import { Issue } from '../../entities/Issue.js';
import { PullRequest } from '../../entities/PullRequest.js';
import { Release } from '../../entities/Release.js';
import { Repository } from '../../entities/Repository.js';
import { Stargazer } from '../../entities/Stargazer.js';
import { Tag } from '../../entities/Tag.js';
import { Watcher } from '../../entities/Watcher.js';
import { Iterable, Service, ServiceCommitsParams, ServiceResourceParams } from '../service.js';
import { GithubClient } from './client.js';
import { BaseFragmentFactory, FragmentFactory } from './graphql/fragments/Fragment.js';
import { QueryLookup } from './graphql/lookups/Lookup.js';
import { SearchLookup } from './graphql/lookups/SearchLookup.js';
import { StargazersLookup } from './graphql/lookups/StargazersLookup.js';
import { TagsLookup } from './graphql/lookups/TagsLookup.js';
import { WatchersLookup } from './graphql/lookups/WatchersLookup.js';
import { QueryRunner } from './graphql/QueryRunner.js';
import commits from './resources/commits.js';
import discussions from './resources/discussions.js';
import issues from './resources/issues.js';
import pullRequests from './resources/pull_requests.js';
import releases from './resources/releases.js';
import repos from './resources/repos.js';
import { default as users } from './resources/users.js';

/**
 * A service that interacts with the Github API.
 */
export class GithubService implements Service {
  private readonly client: GithubClient;
  private readonly factory: FragmentFactory;

  constructor(client: GithubClient, factory?: FragmentFactory) {
    this.client = client;
    this.factory = factory || new BaseFragmentFactory(false);
  }

  search(total: number): Iterable<Repository> {
    const it = QueryRunner.create(this.client).iterator(
      new SearchLookup({ factory: this.factory, limit: Math.min(total, 100) })
    );

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const searchRes of it) {
          yield {
            data: searchRes.data,
            params: { has_more: !!searchRes.next, ...searchRes.params }
          };
        }
      }
    };
  }

  async user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  async user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;
  async user(id: any, opts?: { byLogin: boolean }): Promise<any> {
    return users(id, { client: this.client, byLogin: opts?.byLogin, factory: this.factory });
  }

  async repository(owner: string, name?: string): Promise<Repository | null> {
    return repos(name ? `${owner}/${name}` : owner, { client: this.client, byName: !!name, factory: this.factory });
  }

  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: 'releases', opts: ServiceResourceParams): Iterable<Release>;
  resource(name: 'commits', opts: ServiceCommitsParams): Iterable<Commit>;
  resource(name: 'issues', opts: ServiceCommitsParams): Iterable<Issue>;
  resource(name: 'pull_requests', opts: ServiceCommitsParams): Iterable<PullRequest>;
  resource<P extends ServiceResourceParams>(name: string, opts: P): Iterable<any> {
    const params = { id: opts.repository, cursor: opts.cursor, first: opts.first };

    switch (name) {
      case 'discussions':
        return discussions(this.client, { factory: this.factory, ...opts });
      case 'releases':
        return releases(this.client, { factory: this.factory, ...opts });
      case 'commits':
        return commits(this.client, { factory: this.factory, ...opts });
      case 'issues':
        return issues(this.client, { factory: this.factory, ...opts });
      case 'pull_requests':
        return pullRequests(this.client, { factory: this.factory, ...opts });
      case 'stargazers':
        return genericIterator(this.client, new StargazersLookup({ factory: this.factory, ...params }));
      case 'watchers':
        return genericIterator(this.client, new WatchersLookup({ factory: this.factory, ...params }));
      case 'tags':
        return genericIterator(this.client, new TagsLookup({ factory: this.factory, ...params }));
      default:
        throw new Error(`Resource ${name} not supported`);
    }
  }
}

/**
 *
 */
function genericIterator<R, T>(client: GithubClient, lookup: QueryLookup<R[], T>): Iterable<R> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for await (const searchRes of QueryRunner.create(client).iterator(lookup)) {
        yield {
          data: searchRes.data,
          params: {
            has_more: !!searchRes.next,
            cursor: searchRes.params.cursor,
            first: searchRes.params.first
          }
        };
      }
    }
  };
}
