import { Class } from 'type-fest';
import { Entity, Issue, Release, Repository, Stargazer, Tag, User, Watcher } from '../entities/Entity.js';

export type PageableParams = {
  page?: number | string;
  per_page?: number;
  [key: string]: unknown;
};

export type Iterable<T extends Entity, P extends object = object> = AsyncIterable<{
  data: T[];
  params: { has_more: boolean } & PageableParams & P;
}>;

export type SearchOptions = {
  language?: string;
  minStargazers?: number;
  maxStargazers?: number;
};

export type ResourceParams = PageableParams & {
  repo: { id: number; node_id: string };
};

/**
 * Service interface to be implemented by all services.
 */
export interface Service {
  search(
    total: number,
    params?: SearchOptions
  ): Iterable<Repository, { page: number; per_page: number } & SearchOptions>;

  user(loginOrId: string | number): Promise<User | null>;
  user(loginOrId: string[] | number[]): Promise<(User | null)[]>;

  repository(ownerOrId: string | number, name?: string): Promise<Repository | null>;

  resource(Entity: Class<Tag>, opts: ResourceParams): Iterable<Tag>;
  resource(Entity: Class<Release>, opts: ResourceParams): Iterable<Release>;
  resource(Entity: Class<Watcher>, opts: ResourceParams): Iterable<Watcher>;
  resource(Entity: Class<Stargazer>, opts: ResourceParams): Iterable<Stargazer>;
  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): Iterable<Issue, { since?: Date }>;
}
