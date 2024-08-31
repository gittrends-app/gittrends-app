import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';

export const gitActor = z.object({
  date: z.coerce.date().optional(),
  email: z.string().optional(),
  name: z.string().optional(),
  user: actor.optional()
});

export default zodSanitize(
  z.object({
    additions: z.number().int(),
    author: gitActor.optional(),
    authored_by_committer: z.boolean(),
    authored_date: z.coerce.date().optional(),
    changed_files_if_available: z.number().int().optional(),
    comments_count: z.number().int(),
    committed_date: z.coerce.date().optional(),
    committed_via_web: z.boolean(),
    committer: gitActor.optional(),
    deletions: z.number().int(),
    deployments_count: z.number().int(),
    id: z.string(),
    message: z.string().optional(),
    message_body: z.string().optional(),
    message_headline: z.string().optional(),
    oid: z.string(),
    parents: z.array(z.string()).optional(),
    repository: z.string(),
    status: z.string().optional()
  })
);
