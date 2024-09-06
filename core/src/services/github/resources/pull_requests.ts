import { Commentable } from '../../../entities/base/Commentable.js';
import { Reactable } from '../../../entities/base/Reactable.js';
import { Node } from '../../../entities/index.js';
import { PullRequest } from '../../../entities/PullRequest.js';
import { Iterable, ServiceResourceParams } from '../../service.js';
import { GithubClient } from '../client.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { PullRequestsLookup } from '../graphql/lookups/PullRequestsLookup.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { TimelineItemsCommentsLookup } from '../graphql/lookups/TimelineItemsCommentsLookup.js';
import { TimelineItemsLookup } from '../graphql/lookups/TimelineItemsLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 * Get the pull requests of a repository by its id
 */
export default function (
  client: GithubClient,
  options: ServiceResourceParams & { factory: FragmentFactory }
): Iterable<PullRequest> {
  const { repository: repo, ...opts } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const it = QueryRunner.create(client).iterator(new PullRequestsLookup({ ...opts, id: repo }));

      const { factory, first } = opts;

      for await (const res of it) {
        await Promise.all(
          res.data.map(async (pr) => {
            if (pr.reactions_count) {
              pr.reactions = await QueryRunner.create(client)
                .fetchAll(new ReactionsLookup({ id: pr.id, first, factory }))
                .then(({ data }) => data);
            }

            if (pr.timeline_items_count) {
              pr.timeline_items = await QueryRunner.create(client)
                .fetchAll(new TimelineItemsLookup({ id: pr.id, type: 'PullRequest', first, factory }))
                .then(({ data }) => data);

              const commentables = (pr.timeline_items || []).filter(
                (item) => ((item as Partial<Commentable>).comments_count || 0) > 0
              ) as (Node & Commentable)[];

              await Promise.all(
                commentables.map(async (commentable) => {
                  commentable.comments = await QueryRunner.create(client)
                    .fetch(new TimelineItemsCommentsLookup({ id: commentable.id, first: 100, factory }))
                    .then(({ data }) => data.comments);
                  return commentable;
                })
              );

              const reatables = pr.timeline_items!.reduce((reactables: Reactable[], item) => {
                if (typeof item === 'string') return reactables;
                switch (item.__typename) {
                  case 'IssueComment':
                    return [...reactables, item];
                  case 'PullRequestCommitCommentThread':
                  case 'PullRequestReviewThread':
                    return [...reactables, ...(item.comments || [])];
                  case 'PullRequestReview':
                    return [...reactables, item, ...(item.comments || [])];
                  default:
                    return reactables;
                }
              }, []);

              await Promise.all(
                reatables.map(async (reactable) => {
                  if (reactable.reactions_count) {
                    reactable.reactions = await QueryRunner.create(client)
                      .fetchAll(new ReactionsLookup({ id: reactable.id, first, factory }))
                      .then(({ data }) => data);
                  }
                })
              );
            }
          })
        );

        yield {
          data: res.data,
          params: { has_more: !!res.next, first: res.params.first, cursor: res.params.cursor }
        };
      }

      return;
    }
  };
}
