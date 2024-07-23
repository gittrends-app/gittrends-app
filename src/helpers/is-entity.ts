import { Entity, schemas } from '../entities/entity.js';

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
  user: wrapper(schemas.user)
} satisfies Record<string, (data: Record<string, any>) => false | Entity>;
