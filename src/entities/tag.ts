import { z } from 'zod';
import { repositoryResourceSchema } from './repository.js';

export const tagSchema = z
  .object({
    name: z.string(),
    commit: z.object({ sha: z.string() }).transform((commit) => commit.sha),
    node_id: z.string(),
    __typename: z.literal('Tag').default('Tag'),
    __obtained_at: z.date().default(() => new Date())
  })
  .merge(repositoryResourceSchema);

export type Tag = z.infer<typeof tagSchema>;
