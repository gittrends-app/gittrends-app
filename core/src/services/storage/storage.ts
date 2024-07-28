import { Class } from 'type-fest';
import { Entity } from '../../entities/Entity.js';

export interface EntityStorage<T extends Entity> {
  get: (query: Partial<WithoutMethods<T>>) => Promise<T | null>;
  find: (query: Partial<WithoutMethods<T>>) => Promise<T[]>;
  save: (data: T | T[], replace?: boolean) => Promise<void>;
}

export interface Storage {
  create<T extends Entity>(Entity: Class<T>): EntityStorage<T>;
}
