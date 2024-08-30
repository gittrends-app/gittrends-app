import { UserConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import watcher from '../../../../entities/schemas/watcher.js';
import { ActorFragment, PartialActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository watchers.
 */
export class WatchersLookup extends QueryLookup<z.infer<typeof watcher>[], { full?: boolean }> {
  constructor(props: { id: string; cursor?: string; first?: number; alias?: string; full?: boolean }) {
    const { alias, ...rest } = props;
    super(alias || '_watchers_', rest);
    this.fragments.push(this.params.full ? ActorFragment : PartialActorFragment);
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        watchers(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          nodes { ...${(this.params.full ? ActorFragment : PartialActorFragment).alias} }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: UserConnection = (data[this.alias] || data).watchers;
    return {
      next: _data.pageInfo.hasNextPage
        ? new WatchersLookup({
            alias: this.alias,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: (_data.nodes || []).map((data) =>
        watcher.parse({
          user: (this.params.full ? ActorFragment : PartialActorFragment).parse(data!),
          repository: this.params.id
        })
      ),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }
}
