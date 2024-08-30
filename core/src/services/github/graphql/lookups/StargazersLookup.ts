import { StargazerEdge } from '@octokit/graphql-schema';
import { z } from 'zod';
import stargazer from '../../../../entities/schemas/stargazer.js';
import { ActorFragment, PartialActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository stargazers.
 */
export class StargazersLookup extends QueryLookup<z.infer<typeof stargazer>[], { full?: boolean }> {
  constructor(props: { id: string; cursor?: string; first?: number; alias?: string; full?: boolean }) {
    const { alias, ...rest } = props;
    super(alias || '_stargazers_', rest);
    this.fragments.push(this.params.full ? ActorFragment : PartialActorFragment);
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`, 'orderBy: { field: STARRED_AT, direction: ASC}'];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        stargazers(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          edges {
            starredAt
            node { ...${(this.params.full ? ActorFragment : PartialActorFragment).alias} }
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    data = (data[this.alias] || data).stargazers;
    return {
      next: data.pageInfo.hasNextPage
        ? new StargazersLookup({
            alias: this.alias,
            id: this.params.id as string,
            cursor: data.pageInfo.endCursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: data.edges.map((data: StargazerEdge) =>
        stargazer.parse({
          starred_at: data.starredAt,
          user: this.fragments[0].parse(data.node),
          repository: this.params.id
        })
      ),
      params: { ...this.params, cursor: data.pageInfo.endCursor }
    };
  }
}
