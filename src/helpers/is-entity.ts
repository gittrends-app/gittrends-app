import { Entity, entities } from '../entities/entities.js';

/**
 *  Create a wrapper for a schema to catch errors
 */
function wrapper<T extends Entity>(schema: (data: Record<string, any>) => T) {
  return (data: Record<string, any>): false | T => {
    try {
      return schema(data);
    } catch (error) {
      return false;
    }
  };
}

export default {
  user: wrapper(entities.user),
  reaction: wrapper(entities.reaction)
} satisfies Record<string, (data: Record<string, any>) => false | Entity>;
