import { Repository } from '@octokit/graphql-schema';
import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup, QueryLookupParams } from './Lookup.js';

/**
 *  A lookup to get a user by ID.
 */
export class SearchLookup extends QueryLookup<z.infer<typeof repository>[], { limit: number }> {
  constructor(params: Omit<QueryLookupParams, 'id'> & { limit: number }) {
    super({ ...params, id: 'search' });
  }

  toString(): string {
    const query = ['stars:1..*', 'sort:stars-desc'];

    const total = Math.min(this.params.first || 100, this.params.limit);

    const params = [`first: ${total}`, 'type: REPOSITORY', `query: "${query.join(' ')}"`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:search(${params.join(', ')}) {
      pageInfo { hasNextPage endCursor }
      nodes { ...${this.fragments[0].alias} }
    }
    `;
  }

  parse(data: any) {
    data = data[this.alias] || data;
    this.params.limit -= data.nodes.length;
    return {
      next:
        this.params.limit > 0 && data.pageInfo.hasNextPage
          ? new SearchLookup({ ...this.params, cursor: data.pageInfo.endCursor })
          : undefined,
      data: data.nodes.map((data: Repository) => this.fragments[0].parse(data)),
      params: { ...this.params, cursor: data.pageInfo.endCursor }
    };
  }

  get fragments() {
    return [this.params.factory.create(RepositoryFragment)];
  }
}
