import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import commit, { gitActor } from './commit.js';

export default zodSanitize(
  z.object({
    id: z.string(),
    name: z.string(),
    repository: z.string(),
    oid: z.string().optional(),
    message: z.string().optional(),
    tagger: gitActor.optional(),
    target: z.union([commit, z.string()]).optional()
  })
);
