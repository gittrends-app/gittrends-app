import { z } from 'zod';
import { ReactionSchema } from '../Reaction.js';
import { NodeSchema } from './Node.js';

export const ReactableSchema = NodeSchema.extend({
  reactions_count: z.number().int(),
  reactions: z.array(ReactionSchema).optional()
});

export type Reactable = z.output<typeof ReactableSchema>;
