import { Octokit } from '@octokit/rest';
import { Repository, repositorySchema } from '../../entities/repository.js';

/**
 * Get a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export default async function get(
  owner: string,
  name: string,
  props: { client: Octokit }
): Promise<Repository | undefined> {
  return props.client.repos.get({ owner, repo: name }).then((response) => {
    if (response.status !== 200) return undefined;
    return repositorySchema.parse(response.data);
  });
}
