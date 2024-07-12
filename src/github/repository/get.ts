import { GetResponseDataTypeFromEndpointMethod, OctokitResponse } from '@octokit/types';
import { MergeExclusive } from 'type-fest';
import { Repository, repositorySchema } from '../../entities/repository.js';
import { clients } from '../clients.js';

type RequestResponse = OctokitResponse<
  GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.get>
>;

/**
 * Get a repository by owner and name.
 *
 * @param params - The repository parameters.
 */
export default async function get(
  params: MergeExclusive<{ repo: number }, { owner: string; name: string }>
): Promise<Repository | undefined> {
  const { owner, name, repo } = params;

  const [url, args] = repo
    ? [`/repositories/${repo}`, {}]
    : [`/repos/:owner/:name`, { owner, name }];

  return clients.rest.request(url, args).then((response: RequestResponse) => {
    if (response.status !== 200) return undefined;
    return repositorySchema.parse(response.data);
  });
}
