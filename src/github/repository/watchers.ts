import { User, userSchema } from '../../entities/user.js';
import { rest } from '../client.js';
import { RepositoryParams } from './index.js';

/**
 * Get the watchers of a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export default async function watchers(
  options: RepositoryParams & { onEach?: (data: User[], metadata: { count: number }) => void }
): Promise<User[]> {
  const { owner, name, onEach } = options;

  let count = 0;
  return rest.paginate(
    rest.activity.listWatchersForRepo,
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
