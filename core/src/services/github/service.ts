/* eslint-disable @typescript-eslint/no-unused-vars */
import min from 'lodash/min.js';
import { Class } from 'type-fest';
import { Issue, PullRequest, Release, Repository, Stargazer, Tag, User, Watcher } from '../../entities/Entity.js';
import { Iterable, ResourceParams, SearchOptions, Service } from '../service.js';
import { GithubClient } from './client.js';
import { request } from './requests/index.js';
import resources from './resources/index.js';
import summary from './resources/summary.js';

/**
 * Github service
 */
export class GithubService implements Service {
  private readonly client: GithubClient;

  constructor(client: GithubClient) {
    this.client = client;
  }

  search(
    total: number,
    opts?: SearchOptions
  ): Iterable<Repository, { page: number; per_page: number } & SearchOptions> {
    const { language } = opts || {};

    let page = 1;
    let count = 0;

    let maxStargazers = Math.max(opts?.maxStargazers || Infinity, 1);
    let maxStargazersRepos: Repository[] = [];

    const minStargazers = Math.max(opts?.minStargazers || 1, 1);

    const { rest } = this.client;

    return {
      [Symbol.asyncIterator]: async function* () {
        do {
          let query = `stars:${minStargazers}..${maxStargazers === Infinity ? '*' : maxStargazers}`;
          if (language) query += ` language:${language}`;

          const it = rest.paginate.iterator(rest.search.repos, {
            q: query,
            sort: 'stars',
            order: 'desc',
            per_page: 100,
            page: 1
          });

          for await (const response of it) {
            const _repos = response.data
              .map((data) => new Repository(data))
              .filter((repo) => maxStargazersRepos.every((r) => r._id !== repo._id))
              .slice(0, total - count);

            count += _repos.length;
            maxStargazers = min(_repos.map((repo) => repo.stargazers_count)) || Infinity;
            maxStargazersRepos = _repos.filter((repo) => repo.stargazers_count === maxStargazers);

            yield {
              data: _repos,
              params: {
                has_more: _repos.length === 100,
                page: page++,
                per_page: 100,
                minStargazers,
                maxStargazers
              }
            };

            if (count >= total) return;
          }
        } while (true);
      }
    };
  }

  async user(loginOrId: string | number): Promise<User | null> {
    const [url, args] =
      typeof loginOrId === 'number'
        ? [`GET /user/:id` as const, { id: loginOrId }]
        : [`GET /users/:login` as const, { login: loginOrId }];

    return request({ client: this.client, url, Entity: User }, args as any).then((user) => user || null);
  }

  async repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    const [url, args] =
      typeof ownerOrId === 'number'
        ? ['GET /repositories/:repo' as const, { repo: ownerOrId }]
        : ['GET /repos/:owner/:name' as const, { owner: ownerOrId, name: name }];

    return request({ client: this.client, url, Entity: Repository }, args as any).then(async (repo) => {
      if (!repo) return null;
      const res = await summary(this.client, { repo });
      return res ? new Repository(repo, { counts: res }) : repo;
    });
  }

  resource(Entity: Class<Tag>, opts: ResourceParams): Iterable<Tag>;
  resource(Entity: Class<Release>, opts: ResourceParams): Iterable<Release>;
  resource(Entity: Class<Stargazer>, opts: ResourceParams): Iterable<Stargazer>;
  resource(Entity: Class<Watcher>, opts: ResourceParams): Iterable<Watcher>;
  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): Iterable<Issue, { since?: Date }>;
  resource(Entity: Class<any>, opts: ResourceParams): Iterable<any> {
    switch (Entity.name) {
      case Stargazer.name:
        return resources.stargazers(this.client, opts);
      case Watcher.name:
        return resources.watchers(this.client, opts);
      case Tag.name:
        return resources.tags(this.client, opts);
      case Release.name:
        return resources.releases(this.client, opts);
      case Issue.name:
      case PullRequest.name:
        return resources.issues(this.client, opts);
      default:
        throw new Error('Method not implemented.');
    }
  }
}
