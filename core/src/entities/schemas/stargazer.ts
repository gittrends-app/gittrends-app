import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import userSchema from './user.js';

export default zodSanitize(
  z.object({
    starred_at: z.coerce.date(),
    user: z.union([userSchema, z.string()])
  })
);
