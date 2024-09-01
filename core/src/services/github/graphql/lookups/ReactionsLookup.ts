import { ReactionConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import reaction from '../../../../entities/schemas/reaction.js';
import { ActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from './Lookup.js';

/**
 *  A lookup to get repository reactions.
 */
export class ReactionsLookup extends QueryLookup<z.infer<typeof reaction>[]> {
  toString(): string {
    const params = [`first: ${this.params.first || 100}`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Reactable {
        __typename
        reactions(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            databaseId
            content
            createdAt
            user { ...${this.fragments[0].alias} }
            reactable { id __typename }
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const typename: string = (data[this.alias] || data).__typename;
    const _data: ReactionConnection = (data[this.alias] || data).reactions;
    return {
      next: _data.pageInfo.hasNextPage
        ? new ReactionsLookup({
            ...this.params,
            cursor: _data.pageInfo.endCursor || this.params.cursor
          })
        : undefined,
      data: (_data.nodes || []).map((data) =>
        reaction.parse({
          id: data!.id,
          database_id: data!.databaseId,
          content: data!.content,
          created_at: data!.createdAt,
          user: data!.user ? this.fragments[0].parse(data!.user) : undefined,
          reactable: { id: this.params.id, name: typename }
        })
      ),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }

  get fragments() {
    return [this.params.factory.create(ActorFragment)];
  }
}
