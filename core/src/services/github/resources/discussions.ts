import {
  Discussion as GDiscussion,
  DiscussionComment as GDiscussionComment,
  Repository
} from '@octokit/graphql-schema';
import { MergeExclusive, PartialDeep } from 'type-fest';
import { Discussion, DiscussionComment } from '../../../entities/Entity.js';
import { toArray } from '../../../helpers/iterable.js';
import { Iterable, PageableParams } from '../../service.js';
import { GithubClient } from '../client.js';
import users from '../graphql/users.js';
import reactionsV4 from './reactions-v4.js';

/**
 *  Transforms the data from the GitHub API into a Discussion schema.
 */
function transform(node: GDiscussion): PartialDeep<Discussion> {
  const data = {
    lock_reason: node.activeLockReason || undefined,
    answer: node.answer?.id,
    answer_chosen_at: node.answerChosenAt,
    answer_chosen_by: users.parse(node.answerChosenBy),
    author: users.parse(node.author),
    author_association: node.authorAssociation,
    body: node.body,
    category: node.category?.name,
    closed: node.closed,
    closed_at: node.closedAt,
    comments_count: node.comments.totalCount,
    created_at: node.createdAt,
    created_via_email: node.createdViaEmail,
    node_id: node.id,
    editor: users.parse(node.editor),
    id: node.databaseId as number,
    includes_created_edit: node.includesCreatedEdit,
    is_awnsered: node.isAnswered || false,
    labels: node.labels?.nodes?.map((n) => n && n.name).filter((n) => n !== null),
    last_edited_at: node.lastEditedAt,
    locked: node.locked,
    number: node.number,
    published_at: node.publishedAt,
    reactions: node.reactionGroups?.reduce((mem: Record<string, number>, group) => {
      return { ...mem, [group.content.toLowerCase()]: group.reactors.totalCount };
    }, {}),
    state_reason: node.stateReason || undefined,
    title: node.title,
    updated_at: node.updatedAt,
    upvote_count: node.upvoteCount
  } satisfies PartialDeep<Discussion>;

  data.reactions = {
    total_count: Object.values(data.reactions || {}).reduce((a, b) => a + b, 0),
    '+1': data.reactions?.['thumbs_up'] || 0,
    '-1': data.reactions?.['thumbs_down'] || 0,
    ...data.reactions
  };

  return data;
}

/**
 *
 */
function transformComment(node: GDiscussionComment): PartialDeep<DiscussionComment> {
  const data = {
    id: node.databaseId as number,
    node_id: node.id,
    author: users.parse(node.author),
    author_association: node.authorAssociation,
    body: node.body,
    created_at: node.createdAt,
    created_via_email: node.createdViaEmail,
    deleted_at: node.deletedAt,
    discussion: node.discussion?.id,
    editor: users.parse(node.editor),
    includes_created_edit: node.includesCreatedEdit,
    is_awnser: node.isAnswer || false,
    is_minimized: node.isMinimized,
    last_edited_at: node.lastEditedAt,
    minimized_reason: node.minimizedReason || undefined,
    published_at: node.publishedAt,
    reactions: node.reactionGroups?.reduce((mem: Record<string, number>, group) => {
      return { ...mem, [group.content.toLowerCase()]: group.reactors.totalCount };
    }, {}),
    replies_count: node.replies.totalCount,
    reply_to: node.replyTo?.id,
    updated_at: node.updatedAt,
    upvote_count: node.upvoteCount
  } satisfies PartialDeep<DiscussionComment>;

  data.reactions = {
    total_count: Object.values(data.reactions || {}).reduce((a, b) => a + b, 0),
    '+1': data.reactions?.['thumbs_up'] || 0,
    '-1': data.reactions?.['thumbs_down'] || 0,
    ...data.reactions
  };

  return data;
}

/**
 * Retrieves the stargazers of a repository.
 */
function discussionComments(
  client: GithubClient,
  opts: { repo: string; discussion: string; comment?: string }
): Iterable<DiscussionComment> {
  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata: { endCursor?: string; hasNextPage: boolean } = { endCursor: undefined, hasNextPage: true };

      do {
        const { discussion, comment } = await client.graphql<
          MergeExclusive<{ discussion: GDiscussion }, { comment: GDiscussionComment }>
        >({
          query: `
            query comments($id: ID!, $perPage: Int, $endCursor: String, $isDiscussion: Boolean = true) {
              discussion: node(id: $id) @include(if: $isDiscussion) {
                ... on Discussion {
                  comments(first: $perPage, after: $endCursor) {
                    totalCount
                    pageInfo { endCursor hasNextPage }
                    nodes { ...CommentFrag }
                  }
                }
              },
              comment: node(id: $id) @skip(if: $isDiscussion) {
                ... on DiscussionComment {
                  replies(first: $perPage, after: $endCursor) {
                    totalCount
                    pageInfo { endCursor hasNextPage }
                    nodes { ...CommentFrag }
                  }
                }
              }
            }

            ${users.fragment('ActorFrag')}

            fragment CommentFrag on DiscussionComment {
              author { ...ActorFrag }
              authorAssociation
              body
              createdAt
              createdViaEmail
              databaseId
              deletedAt
              discussion { id }
              editor { ...ActorFrag }
              id
              includesCreatedEdit
              isAnswer
              isMinimized
              lastEditedAt
              minimizedReason
              publishedAt
              reactionGroups { content reactors { totalCount } }
              replies { totalCount }
              replyTo { id }
              updatedAt
              upvoteCount
              __typename
            }
          `,
          id: opts.comment || opts.discussion,
          perPage: 25,
          endCursor: metadata.endCursor,
          isDiscussion: !opts.comment
        });

        const comments = (comment?.replies.nodes || discussion?.comments.nodes || [])
          .map((node) => transformComment(node as GDiscussionComment))
          .map((data) => new DiscussionComment(data, { repository: opts.repo, discussion: opts.discussion }));

        const commentsReplies = await Promise.all(
          comments.map(async (comment) => {
            if (comment.replies_count === 0) return [];

            const it = discussionComments(client, {
              repo: opts.repo,
              discussion: opts.discussion,
              comment: comment.node_id
            });

            const replies: DiscussionComment[] = [];
            for await (const reply of it) {
              reply.data.map(async (comment) => {
                if (comment._hasReactions) {
                  comment._reactions = await toArray(reactionsV4)(client, { entity: comment });
                }
              });

              replies.push(...reply.data);
            }

            return replies;
          })
        );

        const pageInfo = comment?.replies.pageInfo || discussion?.comments.pageInfo;

        metadata.endCursor = pageInfo?.endCursor || metadata.endCursor;
        metadata.hasNextPage = pageInfo?.hasNextPage || false;

        yield {
          data: comments.concat(...commentsReplies.flat()),
          params: {
            page: metadata.endCursor,
            per_page: 25,
            has_more: metadata.hasNextPage
          }
        };
      } while (metadata.hasNextPage);
    }
  };
}

/**
 * Retrieves the stargazers of a repository.
 */
export default function (
  client: GithubClient,
  options: PageableParams & { repo: { node_id: string } }
): Iterable<Discussion> {
  const { repo, page, per_page: perPage } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const metadata = {
        endCursor: page,
        hasNextPage: true
      };

      do {
        const { repository } = await client.graphql<{ repository: Repository }>({
          query: `
            query discussions($id: ID!, $perPage: Int, $endCursor: String) {
              repository: node(id: $id) {
                ... on Repository {
                  discussions(first: $perPage, orderBy: { field: UPDATED_AT, direction: ASC }, after: $endCursor) {
                    totalCount
                    pageInfo { endCursor hasNextPage }
                    nodes {
                      activeLockReason
                      answer { id }
                      answerChosenAt
                      answerChosenBy { ...ActorFrag }
                      author { ...ActorFrag }
                      authorAssociation
                      body
                      category { name }
                      closed
                      closedAt
                      comments { totalCount }
                      createdAt
                      createdViaEmail
                      databaseId
                      editor { ...ActorFrag }
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
            }

            fragment ActorFrag on Actor {
              ... on Node { id }
              ... on Bot { databaseId }
              ... on Mannequin { databaseId }
              ... on Organization { databaseId }
              ... on User { databaseId isSiteAdmin }
              __typename
              login
            }
            `,
          id: repo.node_id,
          perPage: perPage || 100,
          endCursor: metadata.endCursor
        });

        const discussions = (repository.discussions.nodes || [])
          .map((node) => transform(node as GDiscussion))
          .map((data) => new Discussion(data, { repository: repo.node_id }));

        await Promise.all(
          discussions.map(async (discussion) => {
            if (discussion.comments_count === 0) return;

            const it = discussionComments(client, {
              repo: repo.node_id,
              discussion: discussion.node_id
            });

            discussion._comments = [];
            for await (const comment of it) {
              discussion._comments.push(...comment.data);
              discussion._reactions = await toArray(reactionsV4)(client, { entity: discussion });
            }
          })
        );

        metadata.endCursor = repository.discussions.pageInfo.endCursor || metadata.endCursor;
        metadata.hasNextPage = repository.discussions.pageInfo.hasNextPage || false;

        yield {
          data: discussions,
          params: {
            page: metadata.endCursor,
            per_page: perPage || 100,
            has_more: metadata.hasNextPage
          }
        };
      } while (metadata.hasNextPage);
    }
  };
}
