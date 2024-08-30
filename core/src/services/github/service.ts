/* eslint-disable @typescript-eslint/no-unused-vars */
import { Actor, Iterable, Repository, Service, ServiceResourceParams, Stargazer } from '../service.js';
import { GithubClient } from './client.js';
import { QueryBuilder } from './graphql/QueryBuilder.js';
import { SearchLookup } from './graphql/lookups/SearchLookup.js';
import { StargazersLookup } from './graphql/lookups/StargazersLookup.js';
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
    const it = QueryBuilder.create(this.client)
      .add(new SearchLookup({ limit: Math.min(total, 100) }))
      .iterator();

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const [searchRes] of it) {
          if (!searchRes) return;

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

  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer> {
    const it = QueryBuilder.create(this.client)
      .add(new StargazersLookup({ id: opts.repo, cursor: opts.cursor, first: opts.first, full: opts.full }))
      .iterator();

    return {
      [Symbol.asyncIterator]: async function* () {
        for await (const [searchRes] of it) {
          if (!searchRes) return;

          yield {
            data: searchRes.data,
            params: { has_more: !!searchRes.next, ...searchRes.params }
          };
        }
      }
    };
  }
}
