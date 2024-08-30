import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';

export default zodSanitize(
  z.object({
    total_count: z.number().int().default(0),
    thumbs_up: z.number().int().optional(),
    thumbs_down: z.number().int().optional(),
    laugh: z.number().int().optional(),
    confused: z.number().int().optional(),
    heart: z.number().int().optional(),
    hooray: z.number().int().optional(),
    eyes: z.number().int().optional(),
    rocket: z.number().int().optional()
  })
);
