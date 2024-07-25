import { Entity, Issue, PullRequest, Release, Repository, Stargazer, Tag, User, Watcher } from '../entities/Entity.js';

export type PageableParams = {
  page?: number | string;
  per_page?: number;
  [key: string]: unknown;
};

export type IterableEntity<T extends Entity, P extends object = object> = AsyncIterable<{
  data: T[];
  params: PageableParams & P;
}>;

export type SearchOptions = {
  language?: string;
  minStargazers?: number;
  maxStargazers?: number;
};

export type ResourceParams = PageableParams & {
  repo: { id: number; node_id: string };
};

export interface Service {
  search(
    total: number,
    params?: SearchOptions
  ): IterableEntity<Repository, { page: number; per_page: number; count: number } & SearchOptions>;

  user(loginOrId: string | number): Promise<User | null>;
  repository(ownerOrId: string | number, name?: string): Promise<Repository | null>;

  resource(
    resource: 'issues',
    opts: ResourceParams & { since?: Date }
  ): IterableEntity<Issue | PullRequest, { since?: Date }>;
  resource(resource: 'releases', opts: ResourceParams): IterableEntity<Release>;
  resource(resource: 'stargazers', opts: ResourceParams): IterableEntity<Stargazer>;
  resource(resource: 'tags', opts: ResourceParams): IterableEntity<Tag>;
  resource(resource: 'watchers', opts: ResourceParams): IterableEntity<Watcher>;
}
