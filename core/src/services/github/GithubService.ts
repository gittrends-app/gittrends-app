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
import { Iterable, PageableParams, Service, ServiceCommitsParams, ServiceResourceParams } from '../Service.js';
import { GithubClient } from './GithubClient.js';
import { FullFragmentFactory, PartialFragmentFactory } from './graphql/fragments/Fragment.js';
import { QueryLookup, QueryLookupParams } from './graphql/lookups/Lookup.js';
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

  /**
   * Creates a new GithubService
   * @param client The Github client.
   */
  constructor(client: GithubClient) {
    this.client = client;
  }

  /**
   * Searches for repositories.
   * @see Service.search
   */
  search(total: number, opts?: PageableParams): Iterable<Repository> {
    const it = QueryRunner.create(this.client).iterator(
      new SearchLookup({ factory: new PartialFragmentFactory(), per_page: opts?.per_page, limit: total })
    );

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const searchRes of it) {
          yield {
            data: searchRes.data,
            metadata: { has_more: !!searchRes.next, ...searchRes.params }
          };
        }
      }
    };
  }

  /**
   * Fetches a user by id or login.
   * @see Service.user
   */
  async user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  async user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;
  async user(id: any, opts?: { byLogin: boolean }): Promise<any> {
    return users(id, { client: this.client, byLogin: opts?.byLogin, factory: new FullFragmentFactory() });
  }

  /**
   * Fetches a repository by owner and name.
   * @see Service.repository
   */
  async repository(owner: string, name?: string): Promise<Repository | null> {
    return repos(name ? `${owner}/${name}` : owner, {
      client: this.client,
      byName: !!name,
      factory: new FullFragmentFactory()
    });
  }

  /**
   * Fetches a resource from a repository.
   * @see Service.resource
   */
  resource(name: 'commits', opts: ServiceCommitsParams & { full?: boolean }): Iterable<Commit>;
  resource(name: 'discussions', opts: ServiceResourceParams & { full?: boolean }): Iterable<Discussion>;
  resource(name: 'issues', opts: ServiceResourceParams & { full?: boolean }): Iterable<Issue>;
  resource(name: 'pull_requests', opts: ServiceResourceParams & { full?: boolean }): Iterable<PullRequest>;
  resource(name: 'releases', opts: ServiceResourceParams & { full?: boolean }): Iterable<Release>;
  resource(name: 'stargazers', opts: ServiceResourceParams & { full?: boolean }): Iterable<Stargazer>;
  resource(name: 'tags', opts: ServiceResourceParams & { full?: boolean }): Iterable<Tag>;
  resource(name: 'watchers', opts: ServiceResourceParams & { full?: boolean }): Iterable<Watcher>;
  resource<P extends ServiceResourceParams & { full?: boolean } & Record<string, any>>(
    name: string,
    opts: P
  ): Iterable<any> {
    const params: QueryLookupParams & Partial<{ since: Date; until: Date }> = {
      id: opts.repository,
      cursor: opts.cursor,
      per_page: opts.per_page,
      factory: opts.full ? new FullFragmentFactory() : new PartialFragmentFactory(),
      since: opts.since,
      until: opts.until
    };

    switch (name) {
      case 'discussions':
        return discussions(this.client, params);
      case 'releases':
        return releases(this.client, params);
      case 'commits':
        return commits(this.client, params);
      case 'issues':
        return issues(this.client, params);
      case 'pull_requests':
        return pullRequests(this.client, params);
      case 'stargazers':
        return genericIterator(this.client, new StargazersLookup(params));
      case 'watchers':
        return genericIterator(this.client, new WatchersLookup(params));
      case 'tags':
        return genericIterator(this.client, new TagsLookup(params));
      default:
        throw new Error(`Resource ${name} not supported`);
    }
  }
}

/**
 *  A generic iterator for resources that require a lookup.
 */
function genericIterator<R>(client: GithubClient, lookup: QueryLookup<R[]>): Iterable<R> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for await (const searchRes of QueryRunner.create(client).iterator(lookup)) {
        yield {
          data: searchRes.data,
          metadata: {
            has_more: !!searchRes.next,
            cursor: searchRes.params.cursor,
            per_page: searchRes.params.per_page
          }
        };
      }
    }
  };
}
