import { Tag, tagSchema } from '../../entities/tag.js';
import { rest } from '../client.js';
import { RepositoryParams, ResourceIterator } from './index.js';

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
): ResourceIterator<Tag, TagOptions> {
  const { owner, name, page } = options;

  let done = false;
  let currentPage = Math.max(page || 1, 1);

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (done) return { done: true, value: undefined };

          const response = await rest.repos.listTags({
            owner,
            repo: name,
            per_page: 100,
            page: currentPage
          });

          done ||= response.data.length < 100;

          return {
            done: false,
            value: {
              data: response.data.map((tag) => tagSchema.parse(tag)),
              info: { owner, name, resource: 'tags', page: currentPage++ }
            }
          };
        }
      };
    }
  };
}
