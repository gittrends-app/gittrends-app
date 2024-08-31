import { Iterable, Release, ServiceResourceParams } from '../../service.js';
import { GithubClient } from '../client.js';
import { ReactionsLookup } from '../graphql/lookups/ReactionsLookup.js';
import { ReleasesLookup } from '../graphql/lookups/ReleasesLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

/**
 * Get the releases of a repository by its id
 */
export default function (client: GithubClient, options: ServiceResourceParams): Iterable<Release> {
  const { repo, ...opts } = options;

  return {
    [Symbol.asyncIterator]: async function* () {
      const it = QueryRunner.create(client).iterator(new ReleasesLookup({ ...opts, id: repo }));

      for await (const res of it) {
        await Promise.all(
          res.data.map(async (release) => {
            if (release.reactions_count) {
              release.reactions = await QueryRunner.create(client)
                .fetchAll(new ReactionsLookup({ ...opts, id: release.id }))
                .then(({ data }) => data);
            }
          })
        );

        yield { data: res.data, params: { ...res.params, has_more: !!res.next } };
      }

      return;
    }
  };
}
