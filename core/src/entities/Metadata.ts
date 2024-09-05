import { z } from 'zod';
import { NodeSchema } from './base/Node.js';

export const Metadata = NodeSchema.merge(z.object({ __typename: z.literal('Metadata') })).passthrough();
export type Metadata = z.infer<typeof Metadata>;
