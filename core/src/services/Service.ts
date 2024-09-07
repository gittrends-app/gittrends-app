import { Actor } from '../entities/Actor.js';
import { RepositoryNode } from '../entities/base/RepositoryNode.js';
import { Commit } from '../entities/Commit.js';
import { Discussion } from '../entities/Discussion.js';
import { Issue } from '../entities/Issue.js';
import { PullRequest } from '../entities/PullRequest.js';
import { Release } from '../entities/Release.js';
import { Repository } from '../entities/Repository.js';
import { Stargazer } from '../entities/Stargazer.js';
import { Tag } from '../entities/Tag.js';
import { Watcher } from '../entities/Watcher.js';

export type PageableParams = {
  cursor?: string;
  first?: number;
  [key: string]: unknown;
};

export type Iterable<T = any, P extends object = object> = AsyncIterable<{
  data: T[];
  params: { has_more: boolean } & PageableParams & P;
}>;

export type ServiceResourceParams = RepositoryNode & PageableParams;
export type ServiceCommitsParams = ServiceResourceParams & { since?: Date; until?: Date };

/**
 * Service interface to be implemented by all services.
 */
export interface Service {
  search(total: number, opts?: { first?: number }): Iterable<Repository>;

  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;

  repository(ownerOrId: string, name?: string): Promise<Repository | null>;

  resource(name: 'commits', opts: ServiceCommitsParams): Iterable<Commit>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'issues', opts: ServiceResourceParams): Iterable<Issue>;
  resource(name: 'pull_requests', opts: ServiceResourceParams): Iterable<PullRequest>;
  resource(name: 'releases', opts: ServiceResourceParams): Iterable<Release>;
  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
}
