import { z } from 'zod';

const schema = z
  .object({
    DATABASE_URL: z.string().url().default('postgres://localhost:5432/mining-tool'),
    QUEUE_BOARD_PORT: z.coerce.number().default(3001),
    GITHUB_API_BASE_URL: z.string().url().default('https://api.github.com'),
    GITHUB_API_TOKEN: z.string().optional()
  })
  .refine((data) => data.GITHUB_API_BASE_URL !== 'https://api.github.com' || data.GITHUB_API_TOKEN, {
    message: 'GITHUB_API_TOKEN is required if GITHUB_API_BASE_URL is "https://api.github.com"',
    path: ['GITHUB_API_TOKEN']
  })
  .transform((data) => ({ ...data, GITHUB_DISABLE_THROTTLING: data.GITHUB_API_BASE_URL === 'https://api.github.com' }));

export default schema.parse(process.env);
