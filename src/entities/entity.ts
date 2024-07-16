import { z } from 'zod';
import sanitize from '../helpers/sanitize.js';

const entitySchema = z.object({
  __typename: z.enum([
    'Issue',
    'PullRequest',
    'Release',
    'Repository',
    'Stargazer',
    'Tag',
    'TimelineEvent',
    'User',
    'Watcher'
  ]),
  __obtained_at: z.date().default(() => new Date())
});

/**
 * Create an entity schema with a default __typename field.
 */
export function createEntity<T extends z.SomeZodObject>(name: Entity['__typename'], schema: T) {
  if (!name) throw new Error('Entity name cannot be empty');
  else if (Object.keys(schema.shape).length === 0) throw new Error('Entity schema cannot be empty');

  return z.preprocess(
    (data: any) => sanitize(data),
    entitySchema.merge(z.object({ __typename: z.literal(name).default(name) })).merge(schema)
  );
}

/**
 *
 */
export function createEntityFromUnion<T extends z.ZodDiscriminatedUnion<string, z.SomeZodObject[]>>(
  name: Entity['__typename'],
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
        entitySchema.merge(z.object({ __typename: z.literal(name).default(name) })).merge(obj)
      ) as any
    ) as T
  );
}

export type Entity = z.infer<typeof entitySchema>;
