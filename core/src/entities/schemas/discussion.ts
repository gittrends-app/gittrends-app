import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import discussionComment from './discussion-comment.js';
import reaction from './reaction.js';

export default zodSanitize(
  z.object({
    id: z.string(),
    database_id: z.number(),
    active_lock_reason: z.string().optional(),
    answer: z.union([z.string(), discussionComment]).optional(),
    answer_chosen_at: z.coerce.date().optional(),
    answer_chosen_by: z.union([z.string(), actor]).optional(),
    author: z.union([z.string(), actor]).optional(),
    author_association: z.string(),
    body: z.string(),
    category: z.string(),
    closed: z.boolean(),
    closed_at: z.coerce.date().optional(),
    comments_count: z.number().optional(),
    created_at: z.coerce.date(),
    created_via_email: z.boolean(),
    editor: z.union([z.string(), actor]).optional(),
    includes_created_edit: z.boolean(),
    is_awnsered: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
    last_edited_at: z.coerce.date().optional(),
    locked: z.boolean(),
    number: z.number(),
    published_at: z.coerce.date().optional(),
    reactions_count: z.number().int(),
    state_reason: z.string().optional(),
    title: z.string(),
    updated_at: z.coerce.date().optional(),
    upvote_count: z.number(),

    comments: z.array(discussionComment).optional(),
    reactions: z.array(reaction).optional()
  })
);
