import { z } from 'zod';

const schema = z
  .object({
    MONGO_URL: z.string().url().default('mongodb://localhost:27017'),
    MONGO_DB: z.string().default('public'),
    GITHUB_API_BASE_URL: z.string().url().default('https://api.github.com'),
    GITHUB_API_TOKEN: z.string().optional()
  })
  .refine((data) => data.GITHUB_API_BASE_URL !== 'https://api.github.com' || data.GITHUB_API_TOKEN, {
    message: 'GITHUB_API_TOKEN is required if GITHUB_API_BASE_URL is "https://api.github.com"',
    path: ['GITHUB_API_TOKEN']
  });

export default schema.parse(process.env);
