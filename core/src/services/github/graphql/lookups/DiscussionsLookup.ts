import { DiscussionConnection } from '@octokit/graphql-schema';
import { z } from 'zod';
import discussion from '../../../../entities/schemas/discussion.js';
import { ActorFragment, PartialActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get repository discussions.
 */
export class DiscussionsLookup extends QueryLookup<z.infer<typeof discussion>[], { full?: boolean }> {
  private uFrag;

  constructor(props: { id: string; cursor?: string; first?: number; alias?: string; full?: boolean }) {
    const { alias, ...rest } = props;
    super(alias || '_discussions_', rest);
    this.fragments.push((this.uFrag = props.full ? ActorFragment : PartialActorFragment));
  }

  toString(): string {
    const params = [`first: ${this.params.first || 100}`, 'orderBy: { field: UPDATED_AT, direction: ASC }'];
    if (this.params.cursor) params.push(`after: "${this.params.cursor}"`);

    return `
    ${this.alias}:node(id: "${this.params.id}") {
      ... on Repository {
        discussions(${params.join(', ')}) {
          pageInfo { endCursor hasNextPage }
          nodes {
            activeLockReason
            answer { id }
            answerChosenAt
            answerChosenBy { ...${this.uFrag.alias} }
            author { ...${this.uFrag.alias} }
            authorAssociation
            body
            category { name }
            closed
            closedAt
            comments { totalCount }
            createdAt
            createdViaEmail
            databaseId
            editor { ...${this.uFrag.alias} }
            id
            includesCreatedEdit
            isAnswered
            labels(first: 100) { nodes { name } }
            lastEditedAt
            locked
            number
            publishedAt
            reactionGroups { content reactors { totalCount } }
            stateReason
            title
            updatedAt
            upvoteCount
          }
        }
      }
    }
    `;
  }

  parse(data: any) {
    const _data: DiscussionConnection = (data[this.alias] || data).discussions;
    return {
      next: _data.pageInfo.hasNextPage
        ? new DiscussionsLookup({
            alias: this.alias,
            id: this.params.id as string,
            cursor: _data.pageInfo.endCursor || this.params.cursor,
            first: this.params.first,
            full: this.params.full
          })
        : undefined,
      data: (_data.nodes || []).map((data) => {
        const tData = {
          id: data!.id,
          database_id: data!.databaseId!,
          active_lock_reason: data!.activeLockReason,
          answer: data!.answer?.id,
          answer_chosen_at: data!.answerChosenAt,
          answer_chosen_by: data!.answerChosenBy ? this.uFrag.parse(data!.answerChosenBy) : undefined,
          author: data!.author ? this.uFrag.parse(data!.author) : undefined,
          author_association: data!.authorAssociation,
          body: data!.body,
          category: data!.category?.name,
          closed: data!.closed,
          closed_at: data!.closedAt,
          comments_count: data!.comments.totalCount,
          created_at: data!.createdAt,
          created_via_email: data!.createdViaEmail,
          editor: data!.editor ? this.uFrag.parse(data!.editor) : undefined,
          includes_created_edit: data!.includesCreatedEdit,
          is_awnsered: data!.isAnswered,
          labels: data!.labels?.nodes?.map((label: any) => label.name),
          last_edited_at: data!.lastEditedAt,
          locked: data!.locked,
          number: data!.number,
          published_at: data!.publishedAt,
          reaction_groups: data!.reactionGroups?.reduce(
            (mem: Record<string, number>, group) =>
              Object.assign(
                mem,
                group.reactors.totalCount ? { [group.content.toLowerCase()]: group.reactors.totalCount } : {}
              ),
            {}
          ),
          state_reason: data!.stateReason,
          title: data!.title,
          updated_at: data!.updatedAt,
          upvote_count: data!.upvoteCount
        };

        if (tData.reaction_groups) {
          tData.reaction_groups = {
            total_count: Object.values(tData.reaction_groups).reduce((a, b) => a + b, 0),
            ...tData.reaction_groups
          };
        }

        return discussion.parse(tData);
      }),
      params: { ...this.params, cursor: _data.pageInfo.endCursor || this.params.cursor }
    };
  }
}
