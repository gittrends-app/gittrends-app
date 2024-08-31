import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import commit from './commit.js';
import reaction from './reaction.js';
import tag from './tag.js';

export default zodSanitize(
  z.object({
    author: actor.optional(),
    created_at: z.coerce.date(),
    database_id: z.number().int().optional(),
    id: z.string(),
    is_draft: z.boolean(),
    is_prerelease: z.boolean(),
    name: z.string().optional(),
    published_at: z.coerce.date().optional(),
    reactions_count: z.number().int(),
    repository: z.string(),
    tag: tag.optional(),
    tag_commit: commit.optional(),
    tag_name: z.string(),
    updated_at: z.coerce.date(),

    reactions: z.array(reaction).optional()
  })
);
