import min from 'lodash/min.js';
import { Repository, repositorySchema } from '../entities/repository.js';
import { rest } from './client.js';

type SearchRepositoriesMetadata = {
  count: number;
  minStargazers: number;
  maxStargazers?: number;
};

type SearchOptions = {
  language?: string;
  minStargazers?: number;
  maxStargazers?: number;
  onEach?: (data: Repository[], metadata: SearchRepositoriesMetadata) => void;
};

/**
 * Search for repositories on GitHub.
 *
 * @param total - The total number of repositories to return.
 * @param opts - The search parameters.
 */
export async function searchRepositories(total = 1000, opts: SearchOptions): Promise<Repository[]> {
  const { language } = opts;

  const repos: Repository[] = [];

  let count = 0;
  let maxStargazers = Math.max(opts.maxStargazers || Infinity, 1);
  const minStargazers = Math.max(opts.minStargazers || 1, 1);

  while (count < total) {
    const page = 1;

    let query = `stars:${minStargazers}..${maxStargazers === Infinity ? '*' : maxStargazers}`;
    if (language) query += ` language:${language}`;

    const _repos = await rest.paginate(
      rest.search.repos,
      { q: query, sort: 'stars', order: 'desc', per_page: 100, page },
      (response, done) => {
        const res = response.data
          .map((data) => repositorySchema.parse(data))
          .filter((repo) => repos.every((r) => r.id !== repo.id))
          .slice(0, total - count);

        if ((count += res.length) === total) done();

        opts.onEach?.(res, {
          count,
          minStargazers,
          maxStargazers: maxStargazers === Infinity ? undefined : maxStargazers
        });

        return res;
      }
    );

    _repos.forEach((repo) => repos.push(repo));

    maxStargazers = min(repos.map((repo) => repo.stargazers_count)) || Infinity;
  }

  return repos;
}
