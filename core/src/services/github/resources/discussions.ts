import { MergeExclusive } from 'type-fest';
import { Discussion } from '../../../entities/Discussion.js';
import { DiscussionComment } from '../../../entities/DiscussionComment.js';
import { Iterable, ServiceResourceParams } from '../../service.js';
import { GithubClient } from '../client.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { DiscussionsCommentsLookup } from '../graphql/lookups/DiscussionsCommentsLookup.js';
import { DiscussionsLookup } from '../graphql/lookups/DiscussionsLookup.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 *
 */
async function discussionComments(
  client: GithubClient,
  opts: ServiceResourceParams & { factory: FragmentFactory } & MergeExclusive<
      { discussion: string },
      { comment: string }
    >
): Promise<DiscussionComment[]> {
  const { discussion, comment, ...rest } = opts;

  const res = await QueryRunner.create(client).fetchAll(
    new DiscussionsCommentsLookup({ id: (discussion || comment) as string, isComment: !!comment, ...rest })
  );

  await Promise.all(
    res.data.map(async (comment) => {
      if (comment.reactions_count) {
        comment.reactions = await QueryRunner.create(client)
          .fetchAll(new ReactionsLookup({ ...opts, id: comment.id }))
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
      const { repo, ...rest } = opts;

      for await (const searchRes of QueryRunner.create(client).iterator(new DiscussionsLookup({ id: repo, ...rest }))) {
        const data: Discussion[] = searchRes.data;

        await Promise.all(
          data.map(async (discussion) => {
            if (discussion.reactions_count) {
              discussion.reactions = await QueryRunner.create(client)
                .fetchAll(new ReactionsLookup({ factory: opts.factory, id: discussion.id, first: opts.first }))
                .then(({ data }) => data);
            }

            if (discussion.comments_count) {
              discussion.comments = await discussionComments(client, { ...opts, discussion: discussion.id });
            }
          })
        );

        const { cursor, first } = searchRes.params;

        yield { data, params: { has_more: !!searchRes.next, cursor, first } };
      }
    }
  };
}
