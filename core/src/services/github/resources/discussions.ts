import { MergeExclusive } from 'type-fest';
import { Discussion } from '../../../entities/Discussion.js';
import { DiscussionComment } from '../../../entities/DiscussionComment.js';
import { Iterable, ServiceResourceParams } from '../../Service.js';
import { GithubClient } from '../GithubClient.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { DiscussionsCommentsLookup } from '../graphql/lookups/DiscussionsCommentsLookup.js';
import { DiscussionsLookup } from '../graphql/lookups/DiscussionsLookup.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 *  Recursively retrieve the comments of a discussion.
 */
async function discussionComments(
  client: GithubClient,
  opts: ServiceResourceParams & { factory: FragmentFactory } & MergeExclusive<
      { discussion: string },
      { comment: string }
    >
): Promise<DiscussionComment[]> {
  const { discussion, comment, first, factory } = opts;

  const res = await QueryRunner.create(client).fetchAll(
    new DiscussionsCommentsLookup({ id: (discussion || comment) as string, isComment: !!comment, first, factory })
  );

  await Promise.all(
    res.data.map(async (comment) => {
      if (comment.reactions_count) {
        comment.reactions = await QueryRunner.create(client)
          .fetchAll(new ReactionsLookup({ id: comment.id, first, factory }))
          .then(({ data }) => data);
      }

      if (comment.replies_count) {
        comment.replies = await discussionComments(client, { ...opts, discussion: undefined, comment: comment.id });
      }
    })
  );

  return res.data;
}

/**
 * Retrieves the discussions of a repository.
 */
export default function (
  client: GithubClient,
  opts: ServiceResourceParams & { factory: FragmentFactory }
): Iterable<Discussion> {
  return {
    [Symbol.asyncIterator]: async function* () {
      const { repository: repo, ...rest } = opts;
      const { first, factory } = opts;

      for await (const searchRes of QueryRunner.create(client).iterator(new DiscussionsLookup({ ...rest, id: repo }))) {
        const data: Discussion[] = searchRes.data;

        await Promise.all(
          data.map(async (discussion) => {
            if (discussion.reactions_count) {
              discussion.reactions = await QueryRunner.create(client)
                .fetchAll(new ReactionsLookup({ id: discussion.id, first, factory }))
                .then(({ data }) => data);
            }

            if (discussion.comments_count) {
              discussion.comments = await discussionComments(client, { ...opts, discussion: discussion.id });
            }
          })
        );

        yield {
          data,
          params: { has_more: !!searchRes.next, cursor: searchRes.params.cursor, first: searchRes.params.first }
        };
      }
    }
  };
}
