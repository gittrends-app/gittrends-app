import { ReactionConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import reaction from '../../../../entities/schemas/reaction.js';
import { ActorFragment, PartialActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository reactions.
 */
export class ReactionsLookup extends QueryLookup<z.infer<typeof reaction>[], { full?: boolean }> {
  private uFrag;

  constructor(props: { id: string; cursor?: string; first?: number; alias?: string; full?: boolean }) {
    const { alias, ...rest } = props;
    super(alias || '_reactions_', rest);
    this.fragments.push((this.uFrag = props.full ? ActorFragment : PartialActorFragment));
  }

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
            user { ...${this.uFrag.alias} }
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
            alias: this.alias,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: (_data.nodes || []).map((data) =>
        reaction.parse({
          id: data!.id,
          database_id: data!.databaseId,
          content: data!.content,
          created_at: data!.createdAt,
          user: data!.user ? this.uFrag.parse(data!.user) : undefined,
          reactable: { id: this.params.id, name: typename }
        })
      ),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }
}
