import { z } from 'zod';
import actor from '../entities/schemas/actor.js';
import commit from '../entities/schemas/commit.js';
import discussionComment from '../entities/schemas/discussion-comment.js';
import discussion from '../entities/schemas/discussion.js';
import issue from '../entities/schemas/issue.js';
import release from '../entities/schemas/release.js';
import repository from '../entities/schemas/repository.js';
import stargazer from '../entities/schemas/stargazer.js';
import tag from '../entities/schemas/tag.js';
import watcher from '../entities/schemas/watcher.js';

export type PageableParams = {
  cursor?: string;
  first?: number;
  [key: string]: unknown;
};

export type Iterable<T = any, P extends object = object> = AsyncIterable<{
  data: T[];
  params: { has_more: boolean } & PageableParams & P;
}>;

export type Repository = z.infer<typeof repository>;
export type Actor = z.infer<typeof actor>;
export type Stargazer = z.infer<typeof stargazer>;
export type Watcher = z.infer<typeof watcher>;
export type Discussion = z.infer<typeof discussion>;
export type DiscussionComment = z.infer<typeof discussionComment>;
export type Tag = z.infer<typeof tag>;
export type Release = z.infer<typeof release>;
export type Commit = z.infer<typeof commit>;
export type Issue = z.infer<typeof issue>;

export type ServiceResourceParams = {
  repo: string;
  cursor?: string;
  first?: number;
};

export type ServiceCommitsParams = ServiceResourceParams & { since?: Date; until?: Date };

/**
 * Service interface to be implemented by all services.
 */
export interface Service {
  search(total: number): Iterable<Repository>;

  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;

  repository(ownerOrId: string, name?: string): Promise<Repository | null>;

  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: 'releases', opts: ServiceResourceParams): Iterable<Release>;
  resource(name: 'commits', opts: ServiceCommitsParams): Iterable<Commit>;
  resource(name: 'issues', opts: ServiceCommitsParams): Iterable<Issue>;

  // resource(Entity: Class<Tag>, opts: ResourceParams): Iterable<Tag>;
  // resource(Entity: Class<Release>, opts: ResourceParams): Iterable<Release>;
  // resource(Entity: Class<Watcher>, opts: ResourceParams): Iterable<Watcher>;
  // resource(Entity: Class<Stargazer>, opts: ResourceParams): Iterable<Stargazer>;
  // resource(
  //   Entity: Class<Commit>,
  //   opts: ResourceParams & { since?: Date; until?: Date }
  // ): Iterable<Commit, { since?: Date; until?: Date }>;
  // resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): Iterable<Issue, { since?: Date }>;
}
