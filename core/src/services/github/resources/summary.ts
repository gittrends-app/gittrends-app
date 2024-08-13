import { z } from 'zod';
import summary from '../../../entities/schemas/summary.js';
import { GithubClient } from '../client.js';

type Query = {
  repository: {
    id: string;
    databaseId: number;
    watchers: { totalCount: number };
    stargazers: { totalCount: number };
    tags: { totalCount: number };
    releases: { totalCount: number };
    issues: { totalCount: number };
    pullRequests: { totalCount: number };
    defaultBranchRef: { target: { history: { totalCount: number } } };
  };
};

/**
 * Retrieves the stargazers of a repository.
 */
export default async function (
  client: GithubClient,
  options: { repo: { id: number; node_id: string } }
): Promise<z.infer<typeof summary> | null> {
  const { repository } = await client.graphql<Query>({
    query: `
    query summary($id: ID!) {
      repository: node(id: $id) {
        ... on Repository {
          id
          databaseId
          watchers { totalCount }
          stargazers { totalCount }
          releases { totalCount }
          tags: refs(refPrefix: "refs/tags/") { totalCount }
          issues { totalCount }
          pullRequests { totalCount },
          defaultBranchRef { target { ... on Commit { history { totalCount } } } }
        }
      }
    }
    `,
    id: options.repo.node_id
  });

  return {
    watchers: repository.watchers.totalCount,
    stargazers: repository.stargazers.totalCount,
    tags: repository.tags.totalCount,
    releases: repository.releases.totalCount,
    issues: repository.issues.totalCount,
    pull_requests: repository.pullRequests.totalCount,
    commits: repository.defaultBranchRef.target.history.totalCount
  };
}
