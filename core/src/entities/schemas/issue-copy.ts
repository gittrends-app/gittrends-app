import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import milestoneSchema from './milestone.js';
import reactableSchema from './reactable.js';
import userSchema from './user.js';

export default zodSanitize(
  z.object({
    id: z.number().int(),
    node_id: z.string(),
    number: z.number().int(),
    state: z.enum(['open', 'closed']),
    state_reason: z.enum(['completed', 'reopened', 'not_planned']).optional(),
    title: z.string(),
    body: z.string().optional(),
    user: z.union([userSchema, z.string()]).optional(),
    labels: z
      .array(
        z.union([
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
            .transform((v) => v.name),
          z.string()
        ])
      )
      .optional(),
    assignee: z.union([userSchema, z.string()]).optional(),
    assignees: z.union([z.array(userSchema), z.array(z.string())]).optional(),
    milestone: z.union([milestoneSchema.transform((m) => m.title), z.string()]).optional(),
    locked: z.boolean(),
    active_lock_reason: z.string().optional(),
    comments: z.number().int(),
    pull_request: z
      .union([
        z
          .object({
            merged_at: z.coerce.date().optional(),
            url: z.string().url().optional()
          })
          .transform((v) => v.url !== undefined),
        z.boolean()
      ])
      .optional(),
    closed_at: z.coerce.date().optional(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    draft: z.boolean().optional(),
    closed_by: z.union([userSchema, z.string()]).optional(),
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
);
