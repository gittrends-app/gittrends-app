import { Release } from '../../../entities/Release.js';
import { Iterable, ServiceResourceParams } from '../../Service.js';
import { GithubClient } from '../GithubClient.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { ReleasesLookup } from '../graphql/lookups/ReleasesLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 * Get the releases of a repository by its id
 */
export default function (
  client: GithubClient,
  options: ServiceResourceParams & { factory: FragmentFactory }
): Iterable<Release> {
  const { repository: repo, ...opts } = options;
  const { first, factory } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const it = QueryRunner.create(client).iterator(new ReleasesLookup({ ...opts, id: repo }));

      for await (const res of it) {
        await Promise.all(
          res.data.map(async (release) => {
            if (release.reactions_count) {
              release.reactions = await QueryRunner.create(client)
                .fetchAll(new ReactionsLookup({ id: release.id, first, factory }))
                .then(({ data }) => data);
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
