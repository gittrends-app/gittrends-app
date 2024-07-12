import { Tag, tagSchema } from '../../entities/tag.js';
import { rest } from '../client.js';
import { IterableResource, RepositoryParams } from './index.js';

type TagOptions = {
  page?: number;
};

/**
 * Get the tags of a repository by owner and name.
 *
 * @param owner - The owner of the repository.
 * @param name - The name of the repository.
 * @param props - The properties to pass to the function.
 */
export default function watchers(
  options: RepositoryParams & TagOptions
): IterableResource<Tag, TagOptions> {
  const { owner, name, page } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      let currentPage = Math.max(page || 1, 1);

      do {
        const response = await rest.repos.listTags({
          owner,
          repo: name,
          per_page: 100,
          page: currentPage
        });

        yield {
          data: response.data.map((tag) => tagSchema.parse(tag)),
          metadata: { owner, name, resource: 'tags', page: currentPage++ }
        };

        if (response.data.length < 100) break;
      } while (true);
    }
  };
}
