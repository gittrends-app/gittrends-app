import { z } from 'zod';
import { zodSanitize } from '../helpers/sanitize.js';
import { ActorSchema } from './Actor.js';
import { CommitSchema } from './Commit.js';
import { TagSchema } from './Tag.js';
import { NodeSchema } from './base/Node.js';
import { ReactableSchema } from './base/Reactable.js';
import { RepositoryNodeSchema } from './base/RepositoryNode.js';

export const ReleaseSchema = zodSanitize(
  NodeSchema.merge(RepositoryNodeSchema)
    .merge(ReactableSchema)
    .extend({
      __typename: z.literal('Release'),
      author: ActorSchema.optional(),
      created_at: z.coerce.date(),
      database_id: z.number().int().optional(),
      is_draft: z.boolean(),
      is_prerelease: z.boolean(),
      name: z.string().optional(),
      published_at: z.coerce.date().optional(),
      tag: TagSchema.optional(),
      tag_commit: CommitSchema.optional(),
      tag_name: z.string(),
      updated_at: z.coerce.date()
    })
);

export type Release = z.output<typeof ReleaseSchema>;
