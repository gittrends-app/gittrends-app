import {
  Issue,
  Iterable,
  Release,
  Repository,
  ResourceParams,
  SearchOptions,
  Service,
  Stargazer,
  Tag,
  User,
  Watcher
} from '@/core/index.js';
import { Class } from 'type-fest';

/**
 * A service that passes all requests through to the underlying service.
 */
export class PassthroughService implements Service {
  constructor(private readonly service: Service) {}

  search(
    total: number,
    params?: SearchOptions
  ): Iterable<Repository, { page: number; per_page: number } & SearchOptions> {
    return this.service.search(total, params);
  }

  user(loginOrId: string | number): Promise<User | null>;
  user(loginOrId: string[] | number[]): Promise<(User | null)[]>;
  user(loginOrId: any): Promise<User | null> | Promise<(User | null)[]> {
    return this.service.user(loginOrId);
  }

  repository(ownerOrId: string | number, name?: string): Promise<Repository | null> {
    return this.service.repository(ownerOrId, name);
  }

  resource(Entity: Class<Tag>, opts: ResourceParams): Iterable<Tag>;
  resource(Entity: Class<Release>, opts: ResourceParams): Iterable<Release>;
  resource(Entity: Class<Watcher>, opts: ResourceParams): Iterable<Watcher>;
  resource(Entity: Class<Stargazer>, opts: ResourceParams): Iterable<Stargazer>;
  resource(Entity: Class<Issue>, opts: ResourceParams & { since?: Date }): Iterable<Issue, { since?: Date }>;
  resource(Entity: any, opts: any): any {
    return this.service.resource(Entity, opts);
  }
}
