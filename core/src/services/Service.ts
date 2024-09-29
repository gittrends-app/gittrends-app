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

/**
 * Pageable parameters.
 */
export type PageableParams = {
  cursor?: string;
  per_page?: number;
};

/**
 * Iterable type.
 */
export type Iterable<T = any, P extends object = object> = AsyncIterable<{
  data: T[];
  metadata: PageableParams & P & { has_more: boolean };
}>;

/**
 * Service resource parameters.
 */
export type ServiceResourceParams = RepositoryNode & PageableParams;

/**
 * Service commits parameters.
 */
export type ServiceCommitsParams = ServiceResourceParams & { since?: Date; until?: Date };

/**
 * Service interface to be implemented by all services.
 */
export interface Service {
  /**
   * Searches for repositories.
   * @param total The total number of repositories to search for.
   * @param opts The search options.
   */
  search(total: number, opts?: PageableParams): Iterable<Repository>;

  /**
   * Fetches a user by id or login.
   * @param id The user id or login.
   * @param opts The search options.
   * @param opts.byLogin Whether to search by login.
   * @returns The user or null if not found.
   */
  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;

  /**
   * Fetches a repository by owner and name.
   * @param ownerOrId The repository owner or id.
   * @param name The repository name.
   * @returns The repository or null if not found.
   */
  repository(ownerOrId: string, name?: string): Promise<Repository | null>;

  /**
   * Fetches a resource from a repository.
   * @param name The resource name.
   * @param opts The search options.
   * @returns An iterable of the resource.
   */
  resource(name: 'commits', opts: ServiceCommitsParams): Iterable<Commit, { since?: Date; until?: Date }>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'issues', opts: ServiceResourceParams): Iterable<Issue>;
  resource(name: 'pull_requests', opts: ServiceResourceParams): Iterable<PullRequest>;
  resource(name: 'releases', opts: ServiceResourceParams): Iterable<Release>;
  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
}
