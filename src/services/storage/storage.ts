import { Class } from 'type-fest';
import { Entity } from '../../entities/Entity.js';

export type EntityStorage<T extends Entity> = {
  save: (data: T | T[], replace?: boolean) => Promise<void>;
};

export interface Storage {
  create<T extends Entity>(Entity: Class<T>): EntityStorage<T>;
}
