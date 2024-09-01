import { Commit, Iterable, ServiceCommitsParams } from '../../service.js';
import { GithubClient } from '../client.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { CommitsLookup } from '../graphql/lookups/CommitsLookup.js';
import { QueryRunner } from '../graphql/QueryRunner.js';

type IterableCommit = Iterable<Commit, { since?: Date; until?: Date }>;

/**
 * Get the commits of a repository by its id
 *
 */
export default function commits(
  client: GithubClient,
  options: ServiceCommitsParams & { factory: FragmentFactory }
): IterableCommit {
  return {
    [Symbol.asyncIterator]: async function* () {
      let { since, until } = options;

      if (until || !since) {
        const untilIt = QueryRunner.create(client).iterator(
          new CommitsLookup({ ...options, id: options.repo, since: undefined, until })
        );

        for await (const response of untilIt) {
          yield {
            data: response.data,
            params: {
              has_more: true,
              since: (since = new Date(Math.max(response.params.since!.getTime(), since?.getTime() || 0))),
              until: (until = response.params.until),
              first: options.first
            }
          };
        }
      }

      if (since) {
        const sinceIt = QueryRunner.create(client).iterator(
          new CommitsLookup({ ...options, id: options.repo, since, until: undefined })
        );

        for await (const response of sinceIt) {
          yield {
            data: response.data,
            params: {
              has_more: !!response.next,
              since: new Date(Math.max(response.params.since?.getDate() || 0, since.getTime())),
              until,
              first: options.first
            }
          };
        }
      }
    }
  };
}
