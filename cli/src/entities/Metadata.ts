import { NodeSchema } from '@/core/entities/base/Node.js';
import { RepositoryNodeSchema } from '@/core/entities/base/RepositoryNode.js';
import { z } from 'zod';

export const MetadataSchema = NodeSchema.merge(RepositoryNodeSchema)
  .merge(z.object({ cursor: z.string(), since: z.coerce.date(), until: z.coerce.date() }).partial())
  .passthrough();
export type Metadata = z.infer<typeof MetadataSchema>;
