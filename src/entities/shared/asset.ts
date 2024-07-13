import { z } from 'zod';
import { userSchema } from '../user.js';

export const assetSchema = z.object({
  url: z.string().url(),
  browser_download_url: z.string().url(),
  id: z.number().int(),
  node_id: z.string(),
  name: z.string(),
  label: z.string().optional(),
  state: z.enum(['uploaded', 'open']),
  content_type: z.string(),
  size: z.number().int(),
  download_count: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  uploader: z.union([userSchema, z.number()]).optional()
});

export type Asset = z.infer<typeof assetSchema>;
