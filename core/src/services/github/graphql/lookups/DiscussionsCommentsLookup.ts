import { DiscussionCommentConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import discussionComment from '../../../../entities/schemas/discussion-comment.js';
import { ActorFragment, PartialActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository discussions comments.
 */
export class DiscussionsCommentsLookup extends QueryLookup<
  z.infer<typeof discussionComment>[],
  { isComment?: boolean; full?: boolean }
> {
  private uFrag;

  constructor(props: {
    id: string;
    isComment?: boolean;
    cursor?: string;
    first?: number;
    alias?: string;
    full?: boolean;
  }) {
    const { alias, ...rest } = props;
    super(alias || '_discussions_comments_', rest);
    this.fragments.push((this.uFrag = props.full ? ActorFragment : PartialActorFragment));
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on ${this.params.isComment ? 'DiscussionComment' : 'Discussion'} {
        comments:${this.params.isComment ? 'replies' : 'comments'}(${params.join(', ')}) {
          pageInfo { hasNextPage endCursor }  
          nodes {
            author { ...${this.uFrag.alias} }
            authorAssociation
            body
            createdAt
            createdViaEmail
            databaseId
            deletedAt
            discussion { id }
            editor { ...${this.uFrag.alias} }
            id
            includesCreatedEdit
            isAnswer
            isMinimized
            lastEditedAt
            minimizedReason
            publishedAt
            reactions { totalCount }
            replies { totalCount }
            replyTo { id }
            updatedAt
            upvoteCount
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: DiscussionCommentConnection = (data[this.alias] || data).comments;
    if (!_data) throw Object.assign(new Error('Invalid data'), { data, query: this.toString() });
    return {
      next: _data.pageInfo.hasNextPage
        ? new DiscussionsCommentsLookup({
            alias: this.alias,
            isComment: this.params.isComment,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: (_data.nodes || []).map((data) => {
        return discussionComment.parse({
          author: data!.author && this.uFrag.parse(data!.author),
          author_association: data!.authorAssociation,
          body: data!.body,
          created_at: data!.createdAt,
          created_via_email: data!.createdViaEmail,
          database_id: data!.databaseId,
          deleted_at: data!.deletedAt,
          discussion: data!.discussion!.id,
          editor: data!.editor && this.uFrag.parse(data!.editor),
          id: data!.id,
          includes_created_edit: data!.includesCreatedEdit,
          is_awnser: data!.isAnswer,
          is_minimized: data!.isMinimized,
          last_edited_at: data!.lastEditedAt,
          minimized_reason: data!.minimizedReason,
          published_at: data!.publishedAt,
          reactions_count: data!.reactions.totalCount,
          replies_count: data!.replies.totalCount,
          reply_to: data!.replyTo && data!.replyTo.id,
          updated_at: data!.updatedAt,
          upvote_count: data!.upvoteCount
        });
      }),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }
}