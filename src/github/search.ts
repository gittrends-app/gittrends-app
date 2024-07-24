import min from 'lodash/min.js';
import { Repository, schemas } from '../entities/entity.js';
import { IterableResource } from './_requests_/index.js';
import { clients } from './clients.js';

type SearchRepositoriesMetadata = {
  page: number;
  per_page: number;
  count: number;
  minStargazers: number;
  maxStargazers?: number;
};

type SearchOptions = {
  language?: string;
  minStargazers?: number;
  maxStargazers?: number;
};

/**
 * Search for repositories on GitHub.
 *
 * @param total - The total number of repositories to return.
 * @param opts - The search parameters.
 */
function repos(total = 1000, opts?: SearchOptions): IterableResource<Repository, SearchRepositoriesMetadata> {
  const { language } = opts || {};

  let page = 1;
  let count = 0;

  let maxStargazers = Math.max(opts?.maxStargazers || Infinity, 1);
  let maxStargazersRepos: Repository[] = [];

  const minStargazers = Math.max(opts?.minStargazers || 1, 1);

  return {
    [Symbol.asyncIterator]: async function* () {
      do {
        let query = `stars:${minStargazers}..${maxStargazers === Infinity ? '*' : maxStargazers}`;
        if (language) query += ` language:${language}`;

        const it = clients.rest.paginate.iterator(clients.rest.search.repos, {
          q: query,
          sort: 'stars',
          order: 'desc',
          per_page: 100,
          page: 1
        });

        for await (const response of it) {
          const _repos = response.data
            .map((data) => schemas.repo(data))
            .filter((repo) => maxStargazersRepos.every((r) => r.id !== repo.id))
            .slice(0, total - count);

          count += _repos.length;
          maxStargazers = min(_repos.map((repo) => repo.stargazers_count)) || Infinity;
          maxStargazersRepos = _repos.filter((repo) => repo.stargazers_count === maxStargazers);

          yield {
            data: _repos,
            params: { page: page++, per_page: 100, count, minStargazers, maxStargazers }
          };

          if (count >= total) return;
        }
      } while (true);
    }
  };
}

export default { repos };
