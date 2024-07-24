import { MergeExclusive } from 'type-fest';
import { Repository, entities } from '../../entities/entities.js';
import { request } from '../_requests_/index.js';

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
    ? ['GET /repositories/:repo' as const, { repo }]
    : ['GET /repos/:owner/:name' as const, { owner, name }];

  return request({ url, parser: entities.repo }, args as any);
}
