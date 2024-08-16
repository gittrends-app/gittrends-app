import { Commit } from '../../../entities/Entity.js';
import { Iterable } from '../../service.js';
import { GithubClient } from '../client.js';
import { iterator, request } from '../requests/index.js';
import { ResourcesParams } from './index.js';

/**
 * Get a commit by sha.
 */
function commit(client: GithubClient, params: { repo: { id: number; node_id: string }; sha: string }) {
  return request(
    {
      client,
      url: 'GET /repositories/:repo/commits/:sha',
      Entity: Commit,
      metadata: { repository: params.repo.node_id }
    },
    { repo: params.repo.id, sha: params.sha }
  );
}

/**
 * Get the commits of a repository by its id
 *
 */
export default function commits(
  client: GithubClient,
  options: ResourcesParams & { since?: Date; until?: Date }
): Iterable<Commit, { since?: Date; until?: Date }> {
  return {
    [Symbol.asyncIterator]: async function* () {
      let { since, until } = options;

      if (since && until) {
        const its = [
          commits(client, { ...options, until: undefined }),
          commits(client, { ...options, since: undefined })
        ];

        for (const [index, it] of its.entries()) {
          for await (const { data, params } of it) {
            since = params.since && params.since > since ? params.since : since;
            until = params.until && params.until < until ? params.until : until;
            yield { data, params: { ...params, has_more: index === 0 ? true : params.has_more, since, until } };
          }
        }
      } else {
        const it = iterator(
          {
            client,
            url: 'GET /repositories/:repo/commits',
            Entity: Commit,
            metadata: { repository: options.repo.node_id }
          },
          {
            ...options,
            repo: options.repo.id,
            since: since?.toISOString(),
            until: until?.toISOString()
          }
        );

        for await (const { data, params } of it) {
          const detailedData = await Promise.all(
            data.map((d) =>
              commit(client, { repo: options.repo, sha: d.sha }).then((res) => {
                if (!res) throw new Error('Commit not found');
                return res;
              })
            )
          );

          since = since || detailedData[0].commit.committer?.date;
          until = detailedData[detailedData.length - 1].commit.committer?.date || until;

          yield { data: detailedData, params: { ...params, page: 0, since, until } };
        }
      }
    }
  };
}
