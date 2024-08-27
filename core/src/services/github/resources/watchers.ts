import { Repository as GRepository } from '@octokit/graphql-schema';
import { Watcher } from '../../../entities/Entity.js';
import { Iterable, PageableParams } from '../../service.js';
import { GithubClient } from '../client.js';
import users from '../graphql/users.js';

/**
 * Retrieves the watchers of a repository.
 */
export default function (
  client: GithubClient,
  options: PageableParams & { repo: { node_id: string } }
): Iterable<Watcher> {
  const { repo, page, per_page: perPage } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata = {
        endCursor: page,
        hasNextPage: true
      };

      do {
        const { repository } = await client.graphql<{ repository: GRepository }>({
          query: `
            query watchers($id: ID!, $perPage: Int, $endCursor: String) {
              repository: node(id: $id) {
                ... on Repository {
                  watchers (first: $perPage, after: $endCursor) {
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                    nodes { ...UserFrag }
                  }
                }
              }
            }

            ${users.fragment('UserFrag')}
            `,
          id: repo.node_id,
          perPage: perPage || 100,
          endCursor: metadata.endCursor
        });

        const watchers = (repository.watchers.nodes || [])
          .map((node) => users.parse(node))
          .filter((node) => node !== undefined)
          .map((user) => new Watcher(user, { repository: repo.node_id }));

        metadata.endCursor = repository.watchers.pageInfo.endCursor || metadata.endCursor;
        metadata.hasNextPage = repository.watchers.pageInfo.hasNextPage || false;

        yield {
          data: watchers,
          params: {
            page: metadata.endCursor,
            per_page: perPage || 100,
            has_more: metadata.hasNextPage
          }
        };
      } while (metadata.hasNextPage);
    }
  };
}
