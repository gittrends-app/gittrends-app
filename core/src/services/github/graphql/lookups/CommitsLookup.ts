import { CommitHistoryConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import commit from '../../../../entities/schemas/commit.js';
import { CommitFragment, PartialCommitFragment } from '../fragments/CommitFragment.js';
import { QueryLookup, QueryLookupParams } from '../Query.js';

/**
 *
 */
function add(date: Date, seconds: number): Date {
  return new Date(new Date(date).getTime() + seconds * 1000);
}

/**
 *  A lookup to get repository commits.
 */
export class CommitsLookup extends QueryLookup<
  z.infer<typeof commit>[],
  { since?: Date; until?: Date; full?: boolean }
> {
  constructor(props: QueryLookupParams & { alias?: string; since?: Date; until?: Date; full?: boolean }) {
    const { alias, ...rest } = props;
    if (props.since && props.until && props.since >= props.until) throw new Error('Invalid date range.');
    super(alias || '_commits_', { ...rest, until: props.until || new Date() });
    this.fragments.push(this.params.full ? CommitFragment : PartialCommitFragment);
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    if (this.params.since) params.push(`since: "${add(this.params.since, 1).toISOString()}"`);
    if (this.params.until) params.push(`until: "${add(this.params.until, -1).toISOString()}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        defaultBranchRef {
          target {
            ... on Commit {
              history(${params.join(', ')}) {
                pageInfo { hasNextPage endCursor }
                nodes {
                  ...${this.fragments[0].alias}
                }
              }
            }
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: CommitHistoryConnection = (data[this.alias] || data).defaultBranchRef.target.history;
    if (!_data) throw Object.assign(new Error('Failed to parse tags.'), { data, query: this.toString() });

    const parsedData: ReturnType<(typeof CommitFragment)['parse']>[] = (_data.nodes || []).map((data) =>
      this.fragments[0].parse(data)
    );

    return {
      next: _data.pageInfo.hasNextPage
        ? new CommitsLookup({
            alias: this.alias,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full,
            since: this.params.since,
            until: this.params.until
          })
        : undefined,
      data: parsedData,
      params: {
        ...this.params,
        cursor: _data.pageInfo.endCursor || this.params.cursor,
        since: this.params.since || parsedData.at(0)?.committed_date,
        until: parsedData.at(-1)?.committed_date || this.params.until
      }
    };
  }
}
