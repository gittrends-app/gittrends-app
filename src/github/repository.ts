import { Octokit } from '@octokit/rest';
import { Repository, repositorySchema } from '../entities/repository.js';

/**
 * Get a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param repo - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export async function get(
  owner: string,
  repo: string,
  props: { client: Octokit }
): Promise<Repository | undefined> {
  return props.client.repos.get({ owner, repo }).then((response) => {
    if (response.status !== 200) return undefined;
    return repositorySchema.parse(response.data);
  });
}
