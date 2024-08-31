/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Actor,
  Discussion,
  Iterable,
  Repository,
  Service,
  ServiceResourceParams,
  Stargazer,
  Tag,
  Watcher
} from '../service.js';
import { GithubClient } from './client.js';
import { QueryLookup } from './graphql/Query.js';
import { QueryRunner } from './graphql/QueryRunner.js';
import { SearchLookup } from './graphql/lookups/SearchLookup.js';
import { StargazersLookup } from './graphql/lookups/StargazersLookup.js';
import { TagsLookup } from './graphql/lookups/TagsLookup.js';
import { WatchersLookup } from './graphql/lookups/WatchersLookup.js';
import discussions from './resources/discussions.js';
import repos from './resources/repos.js';
import users from './resources/users.js';

/**
 * A service that interacts with the Github API.
 */
export class GithubService implements Service {
  private readonly client: GithubClient;

  constructor(client: GithubClient) {
    this.client = client;
  }

  search(total: number): Iterable<Repository> {
    const it = QueryRunner.create(this.client).iterator(new SearchLookup({ limit: Math.min(total, 100) }));

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
    return users(id, { client: this.client, byLogin: opts?.byLogin });
  }

  async repository(owner: string, name?: string): Promise<Repository | null> {
    return repos(name ? `${owner}/${name}` : owner, { client: this.client, byName: !!name });
  }

  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: string, opts: ServiceResourceParams): Iterable<any> {
    const params = { id: opts.repo, cursor: opts.cursor, first: opts.first, full: opts.full };

    switch (name) {
      case 'discussions':
        return discussions(this.client, opts);
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
 *
 */
function genericIterator<R, T>(client: GithubClient, lookup: QueryLookup<R[], T>): Iterable<R> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for await (const searchRes of QueryRunner.create(client).iterator(lookup)) {
        yield {
          data: searchRes.data,
          params: { has_more: !!searchRes.next, ...searchRes.params }
        };
      }
    }
  };
}
