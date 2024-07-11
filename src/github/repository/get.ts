import { Repository, repositorySchema } from '../../entities/repository.js';
import { rest } from '../client.js';

/**
 * Get a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export default async function get(owner: string, name: string): Promise<Repository | undefined> {
  return rest.repos.get({ owner, repo: name }).then((response) => {
    if (response.status !== 200) return undefined;
    return repositorySchema.parse(response.data);
  });
}
