import { RefConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import tag from '../../../../entities/schemas/tag.js';
import { CommitFragment, PartialCommitFragment } from '../fragments/CommitFragment.js';
import { PartialTagFragment, TagFragment } from '../fragments/TagFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository tags.
 */
export class TagsLookup extends QueryLookup<z.infer<typeof tag>[], { full?: boolean }> {
  constructor(props: { id: string; cursor?: string; first?: number; alias?: string; full?: boolean }) {
    const { alias, ...rest } = props;
    super(alias || '_tags_', rest);
    this.fragments.push(this.params.full ? TagFragment : PartialTagFragment);
    this.fragments.push(this.params.full ? CommitFragment : PartialCommitFragment);
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`, 'refPrefix: "refs/tags/"'];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        tags:refs(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id
            name
            repository { id }
            target {
              __typename
              ...${this.fragments[0].alias}
              ...${this.fragments[1].alias}
            }
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: RefConnection = (data[this.alias] || data).tags;
    if (!_data) throw Object.assign(new Error('Failed to parse tags.'), { data, query: this.toString() });
    return {
      next: _data.pageInfo.hasNextPage
        ? new TagsLookup({
            alias: this.alias,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: (_data.nodes || []).map((data) => {
        const isTag = data!.target?.__typename === 'Tag';
        return this.fragments[0].parse(isTag ? data!.target : data);
      }),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }
}
