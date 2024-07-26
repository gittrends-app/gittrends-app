import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';

export default zodSanitize(
  z.object({
    name: z.string(),
    commit: z.union([z.object({ sha: z.string() }).transform((commit) => commit.sha), z.string()]),
    node_id: z.string()
  })
);
