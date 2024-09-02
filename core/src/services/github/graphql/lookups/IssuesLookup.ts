import { IssueConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import issue from '../../../../entities/schemas/issue.js';
import { IssueFragment } from '../fragments/IssueFragment.js';
import { QueryLookup } from './Lookup.js';

/**
 *  A lookup to get repository issues.
 */
export class IssuesLookup extends QueryLookup<z.infer<typeof issue>[]> {
  toString(): string {
    const params = [`first: ${this.params.first || 100}`, 'orderBy: { field: UPDATED_AT direction: ASC }'];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        issues(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          nodes { ...${this.fragments[0].alias} }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: IssueConnection = (data[this.alias] || data).issues;
    if (!_data) throw Object.assign(new Error('Failed to parse tags.'), { data, query: this.toString() });
    return {
      next: _data.pageInfo.hasNextPage
        ? new IssuesLookup({
            ...this.params,
            cursor: _data.pageInfo.endCursor || this.params.cursor
          })
        : undefined,
      data: (_data.nodes || []).map((data) => this.fragments[0].parse(data!)),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }

  get fragments(): [IssueFragment] {
    return [this.params.factory.create(IssueFragment)];
  }
}
