import { Repository, StargazerEdge } from '@octokit/graphql-schema';
import { graphql } from '@octokit/graphql/types';
import { PartialDeep } from 'type-fest';
import { Stargazer, stargazerSchema } from '../../entities/stargazer.js';
import { ResourceIterator } from './index.js';

/**
 * Transforms the data from the GitHub API into a Stargazer entity.
 *
 * @param data - The data from the GitHub API.
 * @returns The transformed data.
 */
function transform(edge: StargazerEdge): PartialDeep<Stargazer> {
  return {
    starred_at: edge.starredAt,
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

type StargazersOptions = {
  owner: string;
  name: string;
  client: graphql;
  endCursor?: string;
};

/**
 * Retrieves the stargazers of a repository.
 */
export default function stargazers(
  options: StargazersOptions
): ResourceIterator<Stargazer, StargazersMetadata> {
  const metadata: StargazersMetadata = {
    endCursor: options.endCursor,
    hasNextPage: true
  };

  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          const { repository } = await options.client<{ repository: Repository }>({
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
            owner: options.owner,
            repo: options.name,
            endCursor: metadata.endCursor
          });

          const stars = (repository.stargazers.edges || [])
            .map((edge) => edge && transform(edge))
            .map((data) => stargazerSchema.parse(data));

          metadata.endCursor = repository.stargazers.pageInfo.endCursor || undefined;
          metadata.hasNextPage = repository.stargazers.pageInfo.hasNextPage || false;

          return {
            done: stars.length === 0,
            value: {
              data: stars,
              info: {
                owner: options.owner,
                name: options.name,
                resource: 'stargazers',
                ...metadata
              }
            }
          };
        }
      };
    }
  };
}
