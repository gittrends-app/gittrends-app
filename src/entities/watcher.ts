import { z } from 'zod';
import { createEntity } from './entity.js';
import { repoResourceSchema } from './repository.js';
import { userSchema } from './user.js';

export const watcherSchema = createEntity(
  'Watcher',
  z
    .object({
      user: z.union([userSchema, z.number()])
    })
    .merge(repoResourceSchema)
);

export type Watcher = z.infer<typeof watcherSchema>;
