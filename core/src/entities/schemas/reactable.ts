import isPlainObject from 'lodash/isPlainObject.js';
import pickBy from 'lodash/pickBy.js';
import { z } from 'zod';

export default z.preprocess(
  (v: any) => (isPlainObject(v) ? pickBy(v, (value) => (typeof value === 'number' ? value > 0 : true)) : v),
  z
    .object({
      total_count: z.number().int().default(0),
      '+1': z.number().int(),
      '-1': z.number().int(),
      laugh: z.number().int(),
      confused: z.number().int(),
      heart: z.number().int(),
      hooray: z.number().int(),
      eyes: z.number().int(),
      rocket: z.number().int()
    })
    .partial()
    .required({ total_count: true })
);
