import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import repository from './repository.js';

export default zodSanitize(
  z.object({
    starred_at: z.coerce.date(),
    user: z.union([z.string(), actor]),
    repository: z.union([z.string(), repository])
  })
);
