import { Repository, repositorySchema } from '../../entities/repository.js';
import { rest } from '../client.js';
import { RepositoryParams } from './index.js';

/**
 * Get a repository by owner and name.
 *
 * @param params - The repository parameters.
 */
export default async function get(params: RepositoryParams): Promise<Repository | undefined> {
  const { owner, name } = params;
  return rest.repos.get({ owner, repo: name }).then((response) => {
    if (response.status !== 200) return undefined;
    return repositorySchema.parse(response.data);
  });
}
