import { MergeExclusive } from 'type-fest';
import { Discussion, DiscussionComment, Iterable, ServiceResourceParams } from '../../service.js';
import { GithubClient } from '../client.js';
import { DiscussionsCommentsLookup } from '../graphql/lookups/DiscussionsCommentsLookup.js';
import { DiscussionsLookup } from '../graphql/lookups/DiscussionsLookup.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 *
 */
async function discussionComments(
  client: GithubClient,
  opts: ServiceResourceParams & MergeExclusive<{ discussion: string }, { comment: string }>
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
 * Retrieves the stargazers of a repository.
 */
export default function (client: GithubClient, opts: ServiceResourceParams): Iterable<Discussion> {
  return {
    [Symbol.asyncIterator]: async function* () {
      const { repo, ...rest } = opts;

      for await (const searchRes of QueryRunner.create(client).iterator(new DiscussionsLookup({ id: repo, ...rest }))) {
        const data: Discussion[] = searchRes.data;

        for (const discussion of data) {
          if (discussion.reactions_count) {
            const reactions = await QueryRunner.create(client).fetchAll(
              new ReactionsLookup({ id: discussion.id, first: opts.first, full: opts.full })
            );

            discussion.reactions = reactions.data;
          }

          if (discussion.comments_count) {
            discussion.comments = await discussionComments(client, { ...opts, discussion: discussion.id });
          }
        }

        yield {
          data: searchRes.data,
          params: { has_more: !!searchRes.next, ...searchRes.params }
        };
      }
    }
  };
}