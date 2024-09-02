import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import reaction from './reaction.js';
import timelineItem from './timeline-item.js';

export default zodSanitize(
  z.object({
    active_lock_reason: z.string().optional(),
    assignees: z.union([z.array(actor), z.array(z.string())]).optional(),
    author: z.union([actor, z.string()]).optional(),
    author_association: z.string().optional(),
    body: z.string().optional(),
    closed: z.boolean(),
    closed_at: z.coerce.date().optional(),
    comments_count: z.number().int(),
    created_at: z.coerce.date(),
    created_via_email: z.boolean().optional(),
    database_id: z.number().int(),
    editor: z.union([actor, z.string()]).optional(),
    full_database_id: z.coerce.number().int().optional(),
    id: z.string(),
    includes_created_edit: z.boolean().optional(),
    is_pinned: z.boolean().optional(),
    labels: z.array(z.string()).optional(),
    last_edited_at: z.coerce.date().optional(),
    linked_branches: z.array(z.string()).optional(),
    locked: z.boolean(),
    milestone: z.string().optional(),
    number: z.number().int(),
    participants_count: z.number().int(),
    published_at: z.coerce.date().optional(),
    reactions_count: z.number().int(),
    repository: z.string(),
    state: z.string(),
    state_reason: z.string().optional(),
    timeline_items_count: z.number().int(),
    title: z.string(),
    updated_at: z.coerce.date(),
    __typename: z.literal('Issue'),

    reactions: z.array(reaction).optional(),
    timeline_items: z.array(timelineItem).optional()
  })
);
