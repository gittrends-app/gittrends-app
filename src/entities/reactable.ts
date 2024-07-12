import { z } from 'zod';

export const reactableSchema = z.object({
  total_count: z.number().int(),
  '+1': z.number().int(),
  '-1': z.number().int(),
  laugh: z.number().int(),
  confused: z.number().int(),
  heart: z.number().int(),
  hooray: z.number().int(),
  eyes: z.number().int(),
  rocket: z.number().int()
});

export type Reactable = z.infer<typeof reactableSchema>;
