import { Issue } from '../../../entities/Issue.js';
import { Iterable, ServiceResourceParams } from '../../Service.js';
import { GithubClient } from '../GithubClient.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { IssuesLookup } from '../graphql/lookups/IssuesLookup.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { TimelineItemsLookup } from '../graphql/lookups/TimelineItemsLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 * Get the issues of a repository by its id
 */
export default function (
  client: GithubClient,
  options: ServiceResourceParams & { factory: FragmentFactory }
): Iterable<Issue> {
  const { repository: repo, ...opts } = options;
  const { first, factory } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const it = QueryRunner.create(client).iterator(new IssuesLookup({ ...opts, id: repo }));

      for await (const res of it) {
        await Promise.all(
          res.data.map(async (issue) => {
            if (issue.reactions_count) {
              issue.reactions = await QueryRunner.create(client)
                .fetchAll(new ReactionsLookup({ id: issue.id, first, factory }))
                .then(({ data }) => data);
            }

            if (issue.timeline_items_count) {
              issue.timeline_items = await QueryRunner.create(client)
                .fetchAll(new TimelineItemsLookup({ id: issue.id, first, factory }))
                .then(({ data }) => data);

              await Promise.all(
                issue
                  .timeline_items!.filter((item) => item.__typename === 'IssueComment')
                  .map(async (comment) => {
                    if (comment.reactions_count) {
                      comment.reactions = await QueryRunner.create(client)
                        .fetchAll(new ReactionsLookup({ id: comment.id, first, factory }))
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
