import { Reactable as GReactable, Reaction as GReaction } from '@octokit/graphql-schema';
import { PartialDeep } from 'type-fest';
import { Reactable, Reaction, RepositoryResource } from '../../../entities/Entity.js';
import { Iterable, PageableParams } from '../../service.js';
import { GithubClient } from '../client.js';

/**
 * Transforms the data from the GitHub API into a Reaction entity.
 */
function transform(edge: GReaction): PartialDeep<Reaction> {
  let reaction = edge.content.toLowerCase() as any;

  if (reaction === 'thumbs_up') reaction = '+1';
  else if (reaction === 'thumbs_down') reaction = '-1';

  return {
    id: edge.databaseId || undefined,
    node_id: edge.id,
    content: reaction,
    created_at: edge.createdAt as any,
    user: edge.user
      ? {
          id: edge.user.databaseId || undefined,
          login: edge.user.login,
          node_id: edge.user.id,
          site_admin: edge.user.isSiteAdmin,
          type: edge.user.__typename
        }
      : undefined
  };
}

/**
 * Retrieves the Reactions of a entity.
 */
export default function (
  client: GithubClient,
  options: PageableParams & { entity: Reactable & RepositoryResource }
): Iterable<Reaction> {
  const { entity, page, per_page: perPage } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata = {
        endCursor: page,
        hasNextPage: true
      };

      do {
        const { reactable } = await client.graphql<{ reactable: GReactable }>({
          query: `
            query reactions($id: ID!, $perPage: Int, $endCursor: String) {
              reactable: node(id: $id) {
                ... on Reactable {
                  reactions(first: $perPage, after: $endCursor) {
                    pageInfo { endCursor startCursor }
                    nodes {
                      id
                      databaseId
                      content
                      createdAt
                      user { ...ActorFrag }
                    }
                  }
                }
              }
            }

            fragment ActorFrag on Actor {
              ... on Node { id }
              ... on Bot { databaseId }
              ... on Mannequin { databaseId }
              ... on Organization { databaseId }
              ... on User { databaseId isSiteAdmin }
              __typename
              login
            }
            `,
          id: entity._id,
          perPage: perPage || 100,
          endCursor: metadata.endCursor
        });

        const reactions = (reactable.reactions.nodes || [])
          .map((edge) => transform(edge as GReaction))
          .map((data) => new Reaction(data, { reactable: entity }));

        metadata.endCursor = reactable.reactions.pageInfo.endCursor || metadata.endCursor;
        metadata.hasNextPage = reactable.reactions.pageInfo.hasNextPage || false;

        yield {
          data: reactions,
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
