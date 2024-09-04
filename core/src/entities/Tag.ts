import { z } from 'zod';
import { zodSanitize } from '../helpers/sanitize.js';
import { CommitSchema } from './Commit.js';
import { GitActorSchema } from './base/GitActorSchema.js';
import { NodeSchema } from './base/Node.js';
import { RepositoryNodeSchema } from './base/RepositoryNode.js';

export const TagSchema = zodSanitize(
  NodeSchema.merge(RepositoryNodeSchema).extend({
    __typename: z.literal('Tag'),
    name: z.string(),
    oid: z.string().optional(),
    message: z.string().optional(),
    tagger: GitActorSchema.optional(),
    target: z.union([CommitSchema, z.string()]).optional()
  })
);

export type Tag = z.output<typeof TagSchema>;
