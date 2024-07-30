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
      requested_reviewers: z.union([z.array(userSchema), z.array(z.string())]).optional(),
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
        label: z.string().optional(),
        ref: z.string(),
        repo: repositorySchema.innerType().pick({ id: true, node_id: true, full_name: true }).optional(),
        sha: z.string(),
        user: z.union([userSchema, z.string()]).optional()
      }),
      base: z.object({
        label: z.string().optional(),
        ref: z.string(),
        repo: repositorySchema.innerType().pick({ id: true, node_id: true, full_name: true }).optional(),
        sha: z.string(),
        user: z.union([userSchema, z.string()]).optional()
      }),
      auto_merge: z
        .object({
          enabled_by: z.union([userSchema, z.string()]),
          merge_method: z.enum(['merge', 'squash', 'rebase']),
          commit_title: z.string().optional(),
          commit_message: z.string().optional()
        })
        .optional(),
      merged: z.boolean(),
      mergeable: z.boolean().optional(),
      rebaseable: z.boolean().optional(),
      mergeable_state: z.string(),
      merged_by: z.union([userSchema, z.string()]).optional(),
      review_comments: z.number().int(),
      maintainer_can_modify: z.boolean(),
      commits: z.number().int(),
      additions: z.number().int(),
      deletions: z.number().int(),
      changed_files: z.number().int()
    })
  )
);
