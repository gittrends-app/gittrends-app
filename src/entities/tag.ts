import { z } from 'zod';
import { createEntity } from './entity.js';
import { repoResourceSchema } from './repository.js';

export const tagSchema = createEntity(
  'Tag',
  z
    .object({
      name: z.string(),
      commit: z.object({ sha: z.string() }).transform((commit) => commit.sha),
      node_id: z.string()
    })
    .merge(repoResourceSchema)
);

export type Tag = z.infer<typeof tagSchema>;
