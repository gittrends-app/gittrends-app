import { Repository as GRepository } from '@octokit/graphql-schema';
import { Stargazer } from '../../../entities/Entity.js';
import { Iterable, PageableParams } from '../../service.js';
import { GithubClient } from '../client.js';
import users from '../graphql/users.js';

/**
 * Retrieves the stargazers of a repository.
 */
export default function (
  client: GithubClient,
  options: PageableParams & { repo: { id: number; node_id: string } }
): Iterable<Stargazer> {
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
            query stargazers($id: ID!, $perPage: Int, $endCursor: String) {
              repository: node(id: $id) {
                ... on Repository {
                  stargazers (first: $perPage, orderBy:  { field: STARRED_AT, direction: ASC }, after: $endCursor) {
                    pageInfo {
                      endCursor
                      hasNextPage
                    }
                    edges {
                      starredAt
                      node { ...UserFrag }
                    }
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

        const stars = (repository.stargazers.edges || [])
          .filter((edge) => edge !== null)
          .map(
            (edge) =>
              new Stargazer({ starred_at: edge.starredAt, user: users.parse(edge.node) }, { repository: repo.node_id })
          );

        metadata.endCursor = repository.stargazers.pageInfo.endCursor || metadata.endCursor;
        metadata.hasNextPage = repository.stargazers.pageInfo.hasNextPage || false;

        yield {
          data: stars,
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
