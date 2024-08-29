import { Repository } from '@octokit/graphql-schema';
import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class SearchLookup extends QueryLookup<z.infer<typeof repository>[], { limit: number }> {
  constructor(props: { limit: number; cursor?: string; first?: number; alias?: string }) {
    const { alias, ...rest } = props;
    super(alias || 'search', rest);
    this.fragments.push(new RepositoryFragment('RepoFrag', false));
  }

  toString(): string {
    const query = ['stars:1..*', 'sort:stars-desc'];

    const total = Math.min(this.params.first || 100, this.params.limit);

    const params = [`first: ${total}`, 'type: REPOSITORY', `query: "${query.join(' ')}"`];
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
    this.params.limit -= data.nodes.length;
    return {
      next:
        this.params.limit > 0 && data.pageInfo.hasNextPage
          ? new SearchLookup({ alias: this.alias, ...this.params, cursor: data.pageInfo.endCursor })
          : undefined,
      data: data.nodes.map((data: Repository) => this.fragments[0].parse(data)),
      params: { ...this.params, cursor: data.pageInfo.endCursor }
    };
  }
}
