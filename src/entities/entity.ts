import { z } from 'zod';
import sanitize from '../helpers/sanitize.js';

const _schema = z.object({
  __typename: z.string(),
  __obtained_at: z.date().default(() => new Date())
});

/**
 * Create an entity schema with a default __typename field.
 */
export function createEntity<T extends z.SomeZodObject>(name: string, schema: T) {
  if (!name) throw new Error('Entity name cannot be empty');
  else if (Object.keys(schema.shape).length === 0) throw new Error('Entity schema cannot be empty');

  return z.preprocess(
    (data: any) => sanitize(data),
    _schema.merge(z.object({ __typename: z.literal(name).default(name) })).merge(schema)
  );
}

/**
 *
 */
export function createEntityFromUnion<T extends z.ZodDiscriminatedUnion<string, z.SomeZodObject[]>>(
  name: string,
  schema: T
) {
  if (!name) throw new Error('Entity name cannot be empty');
  else if (schema.options.some((o) => Object.keys(o.shape).length === 0))
    throw new Error('Entity schema cannot be empty');

  return z.preprocess(
    (data: any) => sanitize(data),
    z.discriminatedUnion(
      schema.discriminator,
      schema.options.map((obj) =>
        _schema.merge(z.object({ __typename: z.literal(name).default(name) })).merge(obj)
      ) as any
    ) as T
  );
}

export type Enity = z.infer<typeof _schema>;
