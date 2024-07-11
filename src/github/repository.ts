import { Octokit } from '@octokit/rest';
import { Repository, repositorySchema } from '../entities/repository.js';
import { User, userSchema } from '../entities/user.js';

/**
 * Get a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export async function get(
  owner: string,
  name: string,
  props: { client: Octokit }
): Promise<Repository | undefined> {
  return props.client.repos.get({ owner, repo: name }).then((response) => {
    if (response.status !== 200) return undefined;
    return repositorySchema.parse(response.data);
  });
}

/**
 * Get the watchers of a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export async function watchers(
  owner: string,
  name: string,
  props: { client: Octokit; onEach?: (data: User[], metadata: { count: number }) => void }
): Promise<User[]> {
  const { client, onEach } = props;

  let count = 0;
  return client.paginate(
    client.activity.listWatchersForRepo,
    { owner, repo: name, per_page: 100 },
    (response) => {
      if (response.status !== 200)
        throw new Error(`Failed to get watchers for ${owner}/${name} (status: ${response.status})`);
      count += response.data.length;
      const watchers = response.data.map((user) => userSchema.parse(user));
      onEach?.(watchers, { count });
      return watchers;
    }
  );
}
