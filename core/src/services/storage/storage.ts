import { Class } from 'type-fest';
import { Entity } from '../../entities/Entity.js';

/**
 * Interface to be implemented by each Entity.
 */
export interface EntityStorage<T extends Entity> {
  get: (query: Partial<WithoutMethods<T>>) => Promise<T | null>;
  find: (query: Partial<WithoutMethods<T>>, opts?: { limit: number; offset?: number }) => Promise<T[]>;
  save: (data: T | T[], replace?: boolean) => Promise<void>;
}

/**
 * A storage for entities.
 */
export interface Storage {
  create<T extends Entity>(Entity: Class<T>): EntityStorage<T>;
}
