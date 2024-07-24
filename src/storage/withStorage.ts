import { Entity } from '../entities/entity.js';
import { IterableResource } from '../github/_requests_/index.js';
import { Storage } from './index.js';

type Operation<P extends object, E extends Entity> = (args: P) => Promise<E | undefined>;

type NewOperation<P extends object, E extends Entity> = (args: P & { storage: Storage<E> }) => Promise<E | undefined>;

type IteratableOperation<P extends object, E extends Entity> = (args: P) => IterableResource<E>;

type NewIteratableOperation<P extends object, E extends Entity> = (
  args: P & { storage: Storage<E> }
) => IterableResource<E>;

/**
 *
 */
export function withStorage<P extends object, E extends Entity>(operation: Operation<P, E>): NewOperation<P, E> {
  return async ({ storage, ...args }: P & { storage: Storage<E> }) => {
    const entity = await operation(args as P);
    if (entity) storage.save(entity);
    return entity;
  };
}

/**
 *
 */
export function withStorageIt<P extends object, E extends Entity>(
  operation: IteratableOperation<P, E>
): NewIteratableOperation<P, E> {
  return ({ storage, ...args }: P & { storage: Storage<E> }) => ({
    [Symbol.asyncIterator]: async function* () {
      for await (const entity of operation(args as P)) {
        await storage.save(entity.data);
        yield entity;
      }
    }
  });
}
