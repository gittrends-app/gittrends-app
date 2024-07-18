import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import userSchema from './user.js';

export default zodSanitize(
  z.object({
    url: z.string().url(),
    id: z.number().int(),
    node_id: z.string(),
    number: z.number().int(),
    state: z.enum(['open', 'closed']),
    title: z.string(),
    description: z.string().optional(),
    creator: z.union([userSchema, z.number()]).optional(),
    open_issues: z.number().int(),
    closed_issues: z.number().int(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    closed_at: z.coerce.date().optional(),
    due_on: z.coerce.date().optional()
  })
);
