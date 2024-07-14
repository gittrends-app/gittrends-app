import { z } from 'zod';
import { createEntity } from './entity.js';
import { repoResourceSchema, repositorySchema } from './repository.js';
import { milestoneSchema } from './shared/milestone.js';
import { reactableSchema } from './shared/reactable.js';
import { userSchema } from './user.js';

export const issueSchema = createEntity(
  'Issue',
  z
    .object({
      id: z.number().int(),
      node_id: z.string(),
      url: z.string().url(),
      number: z.number().int(),
      state: z.enum(['open', 'closed']),
      state_reason: z.enum(['completed', 'reopened', 'not_planned']).optional(),
      title: z.string(),
      body: z.string().optional(),
      user: userSchema.optional(),
      labels: z.array(
        z.union([
          z.string(),
          z
            .object({
              id: z.number().int().optional(),
              node_id: z.string().optional(),
              url: z.string().url().optional(),
              name: z.string().optional(),
              description: z.string().optional(),
              color: z.string().optional(),
              default: z.boolean().optional()
            })
            .transform((v) => v.name)
        ])
      ),
      assignee: userSchema.optional(),
      assignees: z.array(userSchema.optional()).optional(),
      milestone: milestoneSchema.transform((m) => m.title).optional(),
      locked: z.boolean(),
      active_lock_reason: z.string().optional(),
      comments: z.number().int(),
      pull_request: z
        .object({
          merged_at: z.coerce.date().optional(),
          url: z.string().url().optional()
        })
        .optional(),
      closed_at: z.coerce.date().optional(),
      created_at: z.coerce.date(),
      updated_at: z.coerce.date(),
      draft: z.boolean().optional(),
      closed_by: userSchema.optional(),
      body_html: z.string().optional(),
      body_text: z.string().optional(),
      timeline_url: z.string().url().optional(),
      repository: repositorySchema.transform((v) => v.id).optional(),
      performed_via_github_app: z
        .object({
          id: z.number().int(),
          slug: z.string().optional(),
          name: z.string()
        })
        .optional(),
      author_association: z.enum([
        'COLLABORATOR',
        'CONTRIBUTOR',
        'FIRST_TIMER',
        'FIRST_TIME_CONTRIBUTOR',
        'MANNEQUIN',
        'MEMBER',
        'NONE',
        'OWNER'
      ]),
      reactions: reactableSchema.optional()
    })
    .merge(repoResourceSchema)
);

export type Issue = z.infer<typeof issueSchema>;
