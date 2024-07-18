import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import issueSchema from './issue.js';
import repositorySchema from './repository.js';
import userSchema from './user.js';

export default zodSanitize(
  issueSchema.innerType().merge(
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
