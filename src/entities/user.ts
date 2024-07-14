import { z } from 'zod';
import { createEntity } from './entity.js';

export const userSchema = createEntity(
  'User',
  z.object({
    login: z.string(),
    id: z.number().int(),
    node_id: z.string(),
    avatar_url: z.string().url(),
    gravatar_id: z.string().optional(),
    url: z.string().url(),
    type: z.string(),
    site_admin: z.boolean(),
    name: z.string().optional(),
    company: z.string().optional(),
    blog: z.string().optional(),
    location: z.string().optional(),
    email: z.string().email().optional(),
    notification_email: z.string().email().optional(),
    hireable: z.boolean().optional(),
    bio: z.string().optional(),
    twitter_username: z.string().optional(),
    public_repos: z.number().int().optional(),
    public_gists: z.number().int().optional(),
    followers: z.number().int().optional(),
    following: z.number().int().optional(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
    suspended_at: z.coerce.date().optional(),
    disk_usage: z.number().int().optional(),
    collaborators: z.number().int().optional()
  })
);

export type User = z.infer<typeof userSchema>;
