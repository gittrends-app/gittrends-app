import { z } from 'zod';
import actor from '../entities/schemas/actor.js';
import node from '../entities/schemas/node.js';
import repository from '../entities/schemas/repository.js';

export type PageableParams = {
  cursor?: string;
  limit?: number;
  [key: string]: unknown;
};

export type Iterable<T extends z.infer<typeof node>, P extends object = object> = AsyncIterable<{
  data: T[];
  params: { has_more: boolean } & PageableParams & P;
}>;

export type Repository = z.infer<typeof repository>;
export type Actor = z.infer<typeof actor>;

/**
 * Service interface to be implemented by all services.
 */
export interface Service {
  search(total: number): Iterable<Repository>;

  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;

  repository(ownerOrId: string, name?: string): Promise<Repository | null>;

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
