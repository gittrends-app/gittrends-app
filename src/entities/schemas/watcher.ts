import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import userSchema from './user.js';

export default zodSanitize(
  z.union([
    z.object({
      user: z.union([userSchema, z.string()])
    }),
    userSchema.transform((data) => ({ user: data }))
  ])
);
