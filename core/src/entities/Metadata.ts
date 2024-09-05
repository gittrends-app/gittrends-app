import { z } from 'zod';
import { NodeSchema } from './base/Node.js';

export const Metadata = NodeSchema.passthrough();
export type Metadata = z.infer<typeof Metadata>;
