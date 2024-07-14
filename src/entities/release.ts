import { z } from 'zod';
import { createEntity } from './entity.js';
import { repoResourceSchema } from './repository.js';
import { assetSchema } from './shared/asset.js';
import { reactableSchema } from './shared/reactable.js';
import { userSchema } from './user.js';

export const releaseSchema = createEntity(
  'Release',
  z
    .object({
      url: z.string().url(),
      id: z.number().int(),
      node_id: z.string(),
      tag_name: z.string(),
      target_commitish: z.string(),
      name: z.string().optional(),
      body: z.string().optional(),
      draft: z.boolean(),
      prerelease: z.boolean(),
      created_at: z.coerce.date(),
      published_at: z.coerce.date().optional(),
      author: z.union([userSchema, z.number()]),
      assets: z.array(assetSchema),
      body_html: z.string().optional(),
      body_text: z.string().optional(),
      mentions_count: z.number().int().optional(),
      discussion_url: z.string().url().optional(),
      reactions: reactableSchema.optional()
    })
    .merge(repoResourceSchema)
);

export type Release = z.infer<typeof releaseSchema>;
