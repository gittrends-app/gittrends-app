import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import user from './user.js';

export default zodSanitize(
  z.object({
    id: z.number().int(),
    node_id: z.string(),
    user: z.union([user, z.number().int()]).optional(),
    content: z.enum(['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes']),
    created_at: z.coerce.date()
  })
);
