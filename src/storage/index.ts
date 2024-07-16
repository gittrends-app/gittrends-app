import { Entity } from '../entities/entity.js';
import createMongoStorage from './mongo.js';

export type Storage<T extends Entity> = {
  get: (query: Partial<T>) => Promise<T | null>;
  save: (data: T | T[], replace?: boolean) => Promise<void>;
  remove: (data: T | T[]) => Promise<void>;
  invalidate: (data: T | T[]) => Promise<void>;
};

export { createMongoStorage };
