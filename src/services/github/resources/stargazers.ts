import { PartialDeep } from 'type-fest';
import { Stargazer } from '../../../entities/Entity.js';
import { IterableEntity, PageableParams } from '../../service.js';
import { GithubClient } from '../client.js';

/**
 * Transforms the data from the GitHub API into a Stargazer entity.
 */
function transform(edge: StargazerEdge): PartialDeep<Stargazer> {
  return {
    starred_at: edge.starredAt as any,
    user: {
      id: edge.node.databaseId?.valueOf(),
      login: edge.node.login,
      node_id: edge.node.id,
      site_admin: edge.node.isSiteAdmin,
      type: edge.node.__typename
    }
  };
}

type StargazerEdge = {
  starredAt: string;
  node: {
    id: string;
    login: string;
    databaseId: number;
    __typename: string;
    isSiteAdmin: boolean;
  };
};

type StargazersQuery = {
  repository: {
    stargazers: {
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
      edges: StargazerEdge[];
    };
  };
};

/**
 * Retrieves the stargazers of a repository.
 */
export default function (
  client: GithubClient,
  options: PageableParams & { repo: { id: number; node_id: string } }
): IterableEntity<Stargazer> {
  const { repo, page, per_page: perPage } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata = {
        endCursor: page,
        hasNextPage: true
      };

      do {
        const { repository } = await client.graphql<StargazersQuery>({
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
                      node {
                        id
                        login
                        databaseId
                        __typename
                        isSiteAdmin
                      }
                    }
                  }
                }
              }
            }
            `,
          id: repo.node_id,
          perPage: perPage || 100,
          endCursor: metadata.endCursor
        });

        const stars = (repository.stargazers.edges || [])
          .map((edge) => edge && transform(edge))
          .map((data) => new Stargazer(data, { repository: repo.node_id }));

        metadata.endCursor = repository.stargazers.pageInfo.endCursor || undefined;
        metadata.hasNextPage = repository.stargazers.pageInfo.hasNextPage || false;

        yield {
          data: stars,
          params: { repo, page: metadata.endCursor }
        };
      } while (metadata.hasNextPage);
    }
  };
}
