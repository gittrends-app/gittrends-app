import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import reactable from './reactable.js';
import user from './user.js';

export default zodSanitize(
  z.object({
    id: z.number(),
    node_id: z.string(),
    author: z.union([z.string(), user]).optional(),
    author_association: z.string().optional(),
    body: z.string(),
    created_at: z.coerce.date(),
    created_via_email: z.boolean(),
    deleted_at: z.coerce.date().optional(),
    discussion: z.string().optional(),
    editor: z.union([z.string(), user]).optional(),
    includes_created_edit: z.boolean(),
    is_awnser: z.boolean(),
    is_minimized: z.boolean(),
    last_edited_at: z.coerce.date().optional(),
    minimized_reason: z.string().optional(),
    published_at: z.coerce.date().optional(),
    reactions: reactable.optional(),
    replies_count: z.number(),
    reply_to: z.string().optional(),
    updated_at: z.coerce.date().optional(),
    upvote_count: z.number()
  })
);
