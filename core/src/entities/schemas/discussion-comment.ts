import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import reaction from './reaction.js';

const base = z.object({
  id: z.string(),
  database_id: z.number().int(),
  author: z.union([z.string(), actor]).optional(),
  author_association: z.string().optional(),
  body: z.string(),
  created_at: z.coerce.date(),
  created_via_email: z.boolean(),
  deleted_at: z.coerce.date().optional(),
  discussion: z.string().optional(),
  editor: z.union([z.string(), actor]).optional(),
  includes_created_edit: z.boolean(),
  is_awnser: z.boolean(),
  is_minimized: z.boolean(),
  last_edited_at: z.coerce.date().optional(),
  minimized_reason: z.string().optional(),
  published_at: z.coerce.date().optional(),
  reactions_count: z.number().int(),
  replies_count: z.number().int(),
  reply_to: z.string().optional(),
  updated_at: z.coerce.date().optional(),
  upvote_count: z.number().int()
});

type Input = z.input<typeof base> & {
  reactions?: z.input<typeof reaction>[];
  replies?: Input[];
};

type Output = z.output<typeof base> & {
  reactions?: z.input<typeof reaction>[];
  replies?: Output[];
};

const comment: z.ZodType<Output, z.ZodTypeDef, Input> = base.extend({
  reactions: z.array(reaction).optional(),
  replies: z.lazy(() => comment.array()).optional()
});

export default zodSanitize(comment);
