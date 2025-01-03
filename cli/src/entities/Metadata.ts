import { NodeSchema, RepositoryNodeSchema } from '@gittrends-app/core';
import { z } from 'zod';
import { cleanNulls } from '../helpers/utils.js';

export const MetadataSchema = z.preprocess(
  (value: any) => cleanNulls(value),
  NodeSchema.merge(RepositoryNodeSchema)
    .merge(z.object({ cursor: z.string(), since: z.coerce.date(), until: z.coerce.date() }).partial())
    .passthrough()
);

export type Metadata = z.infer<typeof MetadataSchema>;
