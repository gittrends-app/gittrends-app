import { z } from 'zod';

export default z.object({
  tags: z.number().int(),
  releases: z.number().int(),
  stargazers: z.number().int(),
  watchers: z.number().int(),
  issues: z.number().int(),
  pull_requests: z.number().int()
});
