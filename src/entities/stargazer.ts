import { z } from 'zod';
import { userSchema } from './user.js';

export const stargazerSchema = z.object({
  starred_at: z.coerce.date(),
  user: userSchema,
  __typename: z.literal('Stargazer').default('Stargazer'),
  __obtained_at: z.date().default(new Date())
});

export type Stargazer = z.infer<typeof stargazerSchema>;
