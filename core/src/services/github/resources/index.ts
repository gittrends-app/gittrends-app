import { RepositoryResource } from '../../../entities/Entity.js';
import { Iterable, PageableParams } from '../../service.js';
import { GithubClient } from '../client.js';
import issues from './issues.js';
import releases from './releases.js';
import stargazers from './stargazers.js';
import tags from './tags.js';
import watchers from './watchers.js';

export type ResourcesParams = PageableParams & { repo: { id: number; node_id: string } };

// Export all functions
export default {
  watchers,
  tags,
  stargazers,
  releases,
  issues
} satisfies Record<string, (client: GithubClient, opts: ResourcesParams) => Iterable<RepositoryResource>>;
