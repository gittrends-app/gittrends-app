import { PartialDeep } from 'type-fest';
import { Stargazer, stargazerSchema } from '../../entities/stargazer.js';
import { graphql } from '../client.js';
import { IterableResource, RepositoryParams } from './index.js';

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

type StargazersMetadata = {
  endCursor?: string;
  hasNextPage: boolean;
};

type StargazersParams = RepositoryParams & {
  endCursor?: string;
};

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
export default function stargazers(
  options: StargazersParams
): IterableResource<Stargazer, StargazersMetadata> {
  const { owner, name, endCursor } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata: StargazersMetadata = {
        endCursor: endCursor,
        hasNextPage: true
      };

      do {
        const { repository } = await graphql<StargazersQuery>({
          query: `
            query stargazers($owner: String!, $repo: String!, $endCursor: String){
              repository(owner: $owner, name: $repo) {
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
            `,
          owner: owner,
          repo: name,
          endCursor: metadata.endCursor
        });

        const stars = (repository.stargazers.edges || [])
          .map((edge) => edge && transform(edge))
          .map((data) => stargazerSchema.parse(data));

        metadata.endCursor = repository.stargazers.pageInfo.endCursor || undefined;
        metadata.hasNextPage = repository.stargazers.pageInfo.hasNextPage || false;

        yield {
          data: stars,
          metadata: { owner, name, resource: 'stargazers', ...metadata }
        };
      } while (metadata.hasNextPage);
    }
  };
}
