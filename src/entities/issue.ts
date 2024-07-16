import { z } from 'zod';
import { createEntity } from './entity.js';
import { repoResourceSchema, repositorySchema } from './repository.js';
import { milestoneSchema } from './shared/milestone.js';
import { reactableSchema } from './shared/reactable.js';
import { userSchema } from './user.js';

const baseSchema = z
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
    reactions: reactableSchema.optional(),
    __timeline: z
      .union([z.array(z.object({ event: z.string() }).passthrough()), z.number().int()])
      .optional()
  })
  .merge(repoResourceSchema);

export const issueSchema = createEntity('Issue', baseSchema);

export const pullRequestSchema = createEntity(
  'PullRequest',
  baseSchema.merge(
    z.object({
      merged_at: z.coerce.date().optional(),
      merge_commit_sha: z.string().optional(),
      requested_reviewers: z.array(userSchema).optional(),
      requested_teams: z
        .array(
          z.object({
            id: z.number().int(),
            node_id: z.string(),
            name: z.string(),
            slug: z.string(),
            description: z.string().optional()
          })
        )
        .optional(),
      head: z.object({
        label: z.string(),
        ref: z.string(),
        repo: repositorySchema
          .innerType()
          .pick({ id: true, name: true, full_name: true })
          .optional(),
        sha: z.string(),
        user: userSchema.optional()
      }),
      base: z.object({
        label: z.string(),
        ref: z.string(),
        repo: repositorySchema
          .innerType()
          .pick({ id: true, name: true, full_name: true })
          .optional(),
        sha: z.string(),
        user: userSchema.optional()
      }),
      _links: z.object({
        comments: z.object({ href: z.string() }),
        commits: z.object({ href: z.string() }),
        statuses: z.object({ href: z.string() }),
        html: z.object({ href: z.string() }),
        issue: z.object({ href: z.string() }),
        review_comments: z.object({ href: z.string() }),
        review_comment: z.object({ href: z.string() }),
        self: z.object({ href: z.string() })
      }),
      auto_merge: z
        .object({
          enabled_by: userSchema,
          merge_method: z.enum(['merge', 'squash', 'rebase']),
          commit_title: z.string().optional(),
          commit_message: z.string().optional()
        })
        .optional(),
      merged: z.boolean(),
      mergeable: z.boolean().optional(),
      rebaseable: z.boolean().optional(),
      mergeable_state: z.string(),
      merged_by: userSchema.optional(),
      review_comments: z.number().int(),
      maintainer_can_modify: z.boolean(),
      commits: z.number().int(),
      additions: z.number().int(),
      deletions: z.number().int(),
      changed_files: z.number().int()
    })
  )
);

export type Issue = z.infer<typeof issueSchema>;
export type PullRequest = z.infer<typeof pullRequestSchema>;
