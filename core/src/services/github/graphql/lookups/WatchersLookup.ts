import { UserConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import watcher from '../../../../entities/schemas/watcher.js';
import { ActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from './Lookup.js';

/**
 *  A lookup to get repository watchers.
 */
export class WatchersLookup extends QueryLookup<z.infer<typeof watcher>[]> {
  toString(): string {
    const params = [`first: ${this.params.first || 100}`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        watchers(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          nodes { ...${this.fragments[0].alias} }
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
            ...this.params,
            cursor: _data.pageInfo.endCursor || this.params.cursor
          })
        : undefined,
      data: (_data.nodes || []).map((data) =>
        watcher.parse({
          user: this.fragments[0].parse(data!),
          repository: this.params.id
        })
      ),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }

  get fragments() {
    return [this.params.factory.create(ActorFragment)];
  }
}
