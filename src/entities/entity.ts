import { z } from 'zod';
import { zodSanitize } from '../helpers/sanitize.js';

const _schema = z.object({
  __typename: z.string(),
  __obtained_at: z.date().default(() => new Date())
});

/**
 * Create an entity schema with a default __typename field.
 */
export function createEntity<T extends z.ZodObject<any>>(name: string, schema: T) {
  if (!name) throw new Error('Entity name cannot be empty');
  else if (Object.keys(schema.shape).length === 0) throw new Error('Entity schema cannot be empty');
  return zodSanitize(
    _schema.merge(z.object({ __typename: z.string().default(name) })).merge(schema)
  );
}

export type Enity = z.infer<typeof _schema>;
