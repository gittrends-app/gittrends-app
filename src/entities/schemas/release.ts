import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import assetSchema from './asset.js';
import reactableSchema from './reactable.js';
import userSchema from './user.js';

export default zodSanitize(
  z.object({
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
    author: z.union([userSchema, z.string()]),
    assets: z.array(assetSchema).optional(),
    mentions_count: z.number().int().optional(),
    reactions: reactableSchema.optional()
  })
);
