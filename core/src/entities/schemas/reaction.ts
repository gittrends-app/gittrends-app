import snakeCase from 'lodash/snakeCase.js';
import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';

export default zodSanitize(
  z.object({
    id: z.string(),
    database_id: z.number().int(),
    user: z.union([z.string(), actor]).optional(),
    content: z.preprocess(
      (v) => (typeof v === 'string' ? snakeCase(v) : v),
      z.enum(['thumbs_up', 'thumbs_down', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes'])
    ),
    created_at: z.coerce.date(),
    reactable: z.object({ name: z.string(), id: z.string() })
  })
);
