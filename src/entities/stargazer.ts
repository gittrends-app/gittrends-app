import { z } from 'zod';
import { createEntity } from './entity.js';
import { repoResourceSchema } from './repository.js';
import { userSchema } from './user.js';

export const stargazerSchema = createEntity(
  'Stargazer',
  z
    .object({
      starred_at: z.coerce.date(),
      user: z.union([userSchema, z.number()])
    })
    .merge(repoResourceSchema)
);

export type Stargazer = z.infer<typeof stargazerSchema>;
