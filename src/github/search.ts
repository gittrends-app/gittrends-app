import { Octokit } from '@octokit/rest';
import { Repository, repositorySchema } from '../entities/repository.js';

type SearchRepositoriesParams = {
  client: Octokit;
  language?: string;
  onEachPage?: (data: Repository[], page: number) => void;
};

/**
 * Search for repositories on GitHub.
 *
 * @param total - The total number of repositories to return.
 * @param params - The search parameters.
 */
export async function searchRepositories(
  total = 1000,
  params: SearchRepositoriesParams
): Promise<Repository[]> {
  const { client, language } = params;

  let page = 1;
  let count = total;
  let query = 'stars:>=1';
  if (language) query += ` language:${language}`;

  return client.paginate(
    client.search.repos,
    { q: query, sort: 'stars', order: 'desc', per_page: 100, page },
    (response, done) => {
      const repos = response.data.map((data) => repositorySchema.parse(data)).slice(0, count);
      params.onEachPage?.(repos, page++);
      if ((count -= repos.length) <= 0) done();
      return repos;
    }
  );
}
