import { Repository } from '@octokit/graphql-schema';
import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class SearchLookup extends QueryLookup<z.infer<typeof repository>[]> {
  constructor(props?: { cursor?: string; limit?: number; alias?: string }) {
    const { alias, ...rest } = props || {};
    super(alias || 'search', rest);
    this.fragments.push(new RepositoryFragment('RepoFrag', false));
  }

  toString(): string {
    const query = ['stars:1..*', 'sort:stars-desc'];

    const params = [`first: ${this.params.limit || 100}`, 'type: REPOSITORY', `query: "${query.join(' ')}"`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:search(${params.join(', ')}) {
      pageInfo { hasNextPage endCursor }
      nodes { ...RepoFrag }
    }
    `;
  }

  parse(data: any) {
    data = data[this.alias] || data;
    return {
      next: data.pageInfo.hasNextPage
        ? new SearchLookup({ alias: this.alias, ...this.params, cursor: data.pageInfo.endCursor })
        : undefined,
      data: data.nodes.map((data: Repository) => this.fragments[0].parse(data)),
      params: { ...this.params, cursor: data.pageInfo.endCursor }
    };
  }
}
