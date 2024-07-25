import { Class } from 'type-fest';
import { Entity, Issue, Repository, RepositoryResource, User } from '../entities/Entity.js';

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

  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): IterableEntity<Issue, { since?: Date }>;
  resource<E extends RepositoryResource>(Entity: Class<E>, opts: ResourceParams): IterableEntity<E>;
}
