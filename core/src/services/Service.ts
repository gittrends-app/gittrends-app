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
   *  Fetches commits for a repository.
   * @param opts The commits options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of commits per page.
   * @param opts.cursor The cursor for pagination.
   * @param opts.since The start date.
   * @param opts.until The end date.
   * @returns The commits.
   */
  commits(opts: ServiceCommitsParams): Iterable<Commit, { since?: Date; until?: Date }>;

  /**
   * Fetches discussions for a repository.
   * @param opts The discussions options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of discussions per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The discussions.
   */
  discussions(opts: ServiceResourceParams): Iterable<Discussion>;

  /**
   * Fetches issues for a repository.
   * @param opts The issues options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of issues per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The issues.
   */
  issues(opts: ServiceResourceParams): Iterable<Issue>;

  /**
   * Fetches pull requests for a repository.
   * @param opts The pull requests options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of pull requests per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The pull requests.
   */
  pull_requests(opts: ServiceResourceParams): Iterable<PullRequest>;

  /**
   * Fetches releases for a repository.
   * @param opts The releases options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of releases per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The releases.
   */
  releases(opts: ServiceResourceParams): Iterable<Release>;

  /**
   * Fetches stargazers for a repository.
   * @param opts The stargazers options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of stargazers per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The stargazers.
   */
  stargazers(opts: ServiceResourceParams): Iterable<Stargazer>;

  /**
   * Fetches tags for a repository.
   * @param opts The tags options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of tags per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The tags.
   */
  tags(opts: ServiceResourceParams): Iterable<Tag>;

  /**
   * Fetches watchers for a repository.
   * @param opts The watchers options.
   * @param opts.repository The repository id.
   * @param opts.per_page The number of watchers per page.
   * @param opts.cursor The cursor for pagination.
   * @returns The watchers
   */
  watchers(opts: ServiceResourceParams): Iterable<Watcher>;
}
