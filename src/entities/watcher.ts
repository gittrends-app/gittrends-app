import { z } from 'zod';
import { repositoryResourceSchema } from './repository.js';
import { userSchema } from './user.js';

export const watcherSchema = z
  .object({
    user: z.union([userSchema, z.number()]),
    __typename: z.literal('Watcher').default('Watcher'),
    __obtained_at: z.date().default(() => new Date())
  })
  .merge(repositoryResourceSchema);

export type Watcher = z.infer<typeof watcherSchema>;
