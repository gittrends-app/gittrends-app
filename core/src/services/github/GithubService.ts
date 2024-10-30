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
  private readonly defaultFragmentFactory?: FragmentFactory;

  /**
   * Creates a new GithubService
   * @param client The Github client.
   */
  constructor(client: GithubClient, opts?: { factory?: FragmentFactory }) {
    this.client = client;
    this.defaultFragmentFactory = opts?.factory;
  }

  search(total: number, opts?: PageableParams & { factory?: FragmentFactory }): Iterable<Repository> {
    const it = QueryRunner.create(this.client).iterator(
      new SearchLookup({
        factory: this.defaultFragmentFactory || opts?.factory || new BaseFragmentFactory(),
        per_page: opts?.per_page,
        limit: total
      })
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

  async user(id: string, opts?: { byLogin: boolean; factory?: FragmentFactory }): Promise<Actor | null>;
  async user(id: string[], opts?: { byLogin: boolean; factory?: FragmentFactory }): Promise<(Actor | null)[]>;
  async user(id: any, opts?: { byLogin: boolean; factory?: FragmentFactory }): Promise<any> {
    return users(id, {
      client: this.client,
      byLogin: opts?.byLogin,
      factory: this.defaultFragmentFactory || opts?.factory || new BaseFragmentFactory(true)
    });
  }

  async repository(owner: string, name?: string): Promise<Repository | null>;
  async repository(owner: string, opts?: { factory?: FragmentFactory }): Promise<Repository | null>;
  async repository(owner: string, nameOrOpts?: any, opts?: { factory?: FragmentFactory }): Promise<Repository | null> {
    return repos(nameOrOpts && typeof nameOrOpts === 'string' ? `${owner}/${nameOrOpts}` : owner, {
      client: this.client,
      byName: !!nameOrOpts,
      factory: this.defaultFragmentFactory || opts?.factory || new BaseFragmentFactory(true)
    });
  }

  commits(opts: ServiceCommitsParams & { factory?: FragmentFactory }): Iterable<Commit> {
    return commits(this.client, {
      id: opts.repository,
      cursor: opts.cursor,
      per_page: opts.per_page,
      factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory(),
      since: opts.since,
      until: opts.until
    });
  }

  discussions(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<Discussion> {
    return discussions(this.client, {
      id: opts.repository,
      cursor: opts.cursor,
      per_page: opts.per_page,
      factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
    });
  }

  issues(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<Issue> {
    return issues(this.client, {
      id: opts.repository,
      cursor: opts.cursor,
      per_page: opts.per_page,
      factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
    });
  }

  pull_requests(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<PullRequest> {
    return pullRequests(this.client, {
      id: opts.repository,
      cursor: opts.cursor,
      per_page: opts.per_page,
      factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
    });
  }

  releases(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<Release> {
    return releases(this.client, {
      id: opts.repository,
      cursor: opts.cursor,
      per_page: opts.per_page,
      factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
    });
  }

  stargazers(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<Stargazer> {
    return genericIterator(
      this.client,
      new StargazersLookup({
        id: opts.repository,
        cursor: opts.cursor,
        per_page: opts.per_page,
        factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
      })
    );
  }

  tags(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<Tag> {
    return genericIterator(
      this.client,
      new TagsLookup({
        id: opts.repository,
        cursor: opts.cursor,
        per_page: opts.per_page,
        factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
      })
    );
  }
  watchers(opts: ServiceResourceParams & { factory?: FragmentFactory }): Iterable<Watcher> {
    return genericIterator(
      this.client,
      new WatchersLookup({
        id: opts.repository,
        cursor: opts.cursor,
        per_page: opts.per_page,
        factory: this.defaultFragmentFactory || opts.factory || new BaseFragmentFactory()
      })
    );
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
