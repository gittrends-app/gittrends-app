import { User, userSchema } from '../../entities/user.js';
import { rest } from '../client.js';
import { IterableResource, RepositoryParams } from './index.js';

/**
 * Get the watchers of a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export default function watchers(
  options: RepositoryParams & { page?: number }
): IterableResource<User, { page?: number }> {
  const { owner, name, page } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(page || 1, 1);

      do {
        const response = await rest.activity.listWatchersForRepo({
          owner,
          repo: name,
          per_page: 100,
          page: currentPage
        });

        yield {
          data: response.data.map((user) => userSchema.parse(user)),
          metadata: { owner, name, resource: 'watchers', page: currentPage++ }
        };

        if (response.data.length < 100) break;
      } while (true);
    }
  };
}
