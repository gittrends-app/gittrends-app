import { ReleaseConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import release from '../../../../entities/schemas/release.js';
import { ActorFragment, PartialActorFragment } from '../fragments/ActorFragment.js';
import { CommitFragment, PartialCommitFragment } from '../fragments/CommitFragment.js';
import { PartialTagFragment, TagFragment } from '../fragments/TagFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository releases.
 */
export class ReleasesLookup extends QueryLookup<z.infer<typeof release>[], { full?: boolean }> {
  constructor(props: { id: string; cursor?: string; first?: number; alias?: string; full?: boolean }) {
    const { alias, ...rest } = props;
    super(alias || '_tags_', rest);
    this.fragments.push(this.params.full ? ActorFragment : PartialActorFragment);
    this.fragments.push(this.params.full ? TagFragment : PartialTagFragment);
    this.fragments.push(this.params.full ? CommitFragment : PartialCommitFragment);
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`, 'orderBy: { field: CREATED_AT direction: ASC }'];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        releases(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }
          nodes {
            author { ...${this.fragments[0].alias} }
            createdAt
            databaseId
            description
            id
            isDraft
            isPrerelease
            name
            publishedAt
            reactions { totalCount }
            repository { id }
            tag { 
              id
              name
              repository { id }
              target {
                __typename
                ...${this.fragments[1].alias}
                ...${this.fragments[2].alias}
              }
            }
            tagCommit { ...${this.fragments[2].alias} }
            tagName
            updatedAt
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: ReleaseConnection = (data[this.alias] || data).releases;
    if (!_data) throw Object.assign(new Error('Failed to parse tags.'), { data, query: this.toString() });
    return {
      next: _data.pageInfo.hasNextPage
        ? new ReleasesLookup({
            alias: this.alias,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: (_data.nodes || []).map((data) => {
        const isTag = data!.tag?.target?.__typename === 'Tag';
        return release.parse({
          author: data!.author && this.fragments[0].parse(data!.author),
          created_at: data!.createdAt,
          database_id: data!.databaseId,
          id: data!.id,
          is_draft: data!.isDraft,
          is_prerelease: data!.isPrerelease,
          name: data!.name,
          published_at: data!.publishedAt,
          reactions_count: data!.reactions.totalCount,
          repository: data!.repository.id,
          tag: isTag ? this.fragments[1].parse(data!.tag?.target) : this.fragments[1].parse(data!.tag),
          tag_commit: data!.tagCommit && this.fragments[2].parse(data!.tagCommit),
          tag_name: data!.tagName,
          updated_at: data!.updatedAt
        });
      }),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }
}