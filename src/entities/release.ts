import omitBy from 'lodash/omitBy.js';
import { z } from 'zod';
import { assetSchema } from './asset.js';
import { reactableSchema } from './reactable.js';
import { repositoryResourceSchema } from './repository.js';
import { userSchema } from './user.js';

export const releaseSchema = z.preprocess(
  (data: any) => omitBy(data, (value) => value === null || value === ''),
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
      reactions: reactableSchema.optional(),
      __typename: z.literal('Release').default('Release'),
      __obtained_at: z.date().default(() => new Date())
    })
    .merge(repositoryResourceSchema)
);

export type Release = z.infer<typeof releaseSchema>;
