import { z } from 'zod';

const schema = z
  .object({
    DATABASE_URL: z.string().url().default('mongodb://localhost:27017'),
    REDIS_HOST: z.string().ip().default('127.0.0.1'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_QUEUE_DB: z.coerce.number().default(1),
    GITHUB_API_BASE_URL: z.string().url().default('https://api.github.com'),
    GITHUB_API_TOKEN: z.string().optional(),
    FETCH_RETRIES: z.coerce.number().default(5),
    CACHE_DIR: z.string().default('.cache'),
    CACHE_SIZE: z.coerce.number().default(100000),
    CACHE_TTL: z.coerce.number().default(1000 * 60 * 60 * 24 * 7),
    GEOCODER_CONCURRENCY: z.coerce.number().default(1),
    GEOCODER_CACHE_DIR: z.string().default('.cache'),
    GEOCODER_CACHE_SIZE: z.coerce.number().default(10000),
    GEOCODER_CACHE_TTL: z.coerce.number().default(0)
  })
  .refine((data) => data.GITHUB_API_BASE_URL !== 'https://api.github.com' || data.GITHUB_API_TOKEN, {
    message: 'GITHUB_API_TOKEN is required if GITHUB_API_BASE_URL is "https://api.github.com"',
    path: ['GITHUB_API_TOKEN']
  });

export default schema.parse(process.env);
