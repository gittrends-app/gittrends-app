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
import { FullFragmentFactory, PartialFragmentFactory } from './graphql/fragments/Fragment.js';
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

  constructor(client: GithubClient) {
    this.client = client;
  }

  search(total: number, opts?: { first?: number }): Iterable<Repository> {
    const it = QueryRunner.create(this.client).iterator(
      new SearchLookup({ factory: new PartialFragmentFactory(), first: opts?.first, limit: total })
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
    return users(id, { client: this.client, byLogin: opts?.byLogin, factory: new FullFragmentFactory() });
  }

  async repository(owner: string, name?: string): Promise<Repository | null> {
    return repos(name ? `${owner}/${name}` : owner, {
      client: this.client,
      byName: !!name,
      factory: new FullFragmentFactory()
    });
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
    const factory = new PartialFragmentFactory();

    switch (name) {
      case 'discussions':
        return discussions(this.client, { factory, ...opts });
      case 'releases':
        return releases(this.client, { factory, ...opts });
      case 'commits':
        return commits(this.client, { factory, ...opts });
      case 'issues':
        return issues(this.client, { factory, ...opts });
      case 'pull_requests':
        return pullRequests(this.client, { factory, ...opts });
      case 'stargazers':
        return genericIterator(this.client, new StargazersLookup({ factory, ...params }));
      case 'watchers':
        return genericIterator(this.client, new WatchersLookup({ factory, ...params }));
      case 'tags':
        return genericIterator(this.client, new TagsLookup({ factory, ...params }));
      default:
        throw new Error(`Resource ${name} not supported`);
    }
  }
}

/**
 *  A generic iterator for resources that require a lookup.
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
