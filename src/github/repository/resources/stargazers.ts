import { PartialDeep } from 'type-fest';
import { Stargazer, stargazerSchema } from '../../../entities/stargazer.js';
import { graphql } from '../../client.js';
import { IterableResource, ResourcesParams } from './index.js';

/**
 * Transforms the data from the GitHub API into a Stargazer entity.
 *
 * @param data - The data from the GitHub API.
 * @returns The transformed data.
 */
function transform(edge: StargazerEdge): PartialDeep<Stargazer> {
  return {
    starred_at: edge.starredAt as any,
    user: {
      id: edge.node.databaseId?.valueOf(),
      login: edge.node.login,
      node_id: edge.node.id,
      avatar_url: edge.node.avatarUrl,
      url: edge.node.url,
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
    avatarUrl: string;
    url: string;
    __typename: string;
    isSiteAdmin: boolean;
  };
};

type StargazersQuery = {
  repository: {
    databaseId: number;
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
export default function stargazers(options: ResourcesParams): IterableResource<Stargazer> {
  const { repo, page } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata = {
        endCursor: page,
        hasNextPage: true
      };

      do {
        const { repository } = await graphql<StargazersQuery>({
          query: `
            query stargazers($id: ID!, $endCursor: String) {
              repository: node(id: $id) {
                ... on Repository {
                  databaseId
                  stargazers (first: 100, orderBy:  { field: STARRED_AT, direction: ASC }, after: $endCursor) {
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
                        avatarUrl
                        url
                        __typename
                        isSiteAdmin
                      }
                    }
                  }
                }
              }
            }
            `,
          id: repo,
          endCursor: metadata.endCursor
        });

        const stars = (repository.stargazers.edges || [])
          .map((edge) => edge && transform(edge))
          .map((data) => stargazerSchema.parse({ ...data, __repository: repository.databaseId }));

        metadata.endCursor = repository.stargazers.pageInfo.endCursor || undefined;
        metadata.hasNextPage = repository.stargazers.pageInfo.hasNextPage || false;

        yield {
          data: stars,
          metadata: { repo, page: metadata.endCursor }
        };
      } while (metadata.hasNextPage);
    }
  };
}
