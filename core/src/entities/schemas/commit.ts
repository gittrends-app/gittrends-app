import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import userSchema from './user.js';

export default zodSanitize(
  z.object({
    sha: z.string(),
    node_id: z.string(),
    commit: z.object({
      author: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
          date: z.coerce.date().optional()
        })
        .optional(),
      committer: z
        .object({
          name: z.string().optional(),
          email: z.string().optional(),
          date: z.coerce.date().optional()
        })
        .optional(),
      message: z.string(),
      comment_count: z.number().int(),
      tree: z.union([z.object({ sha: z.string() }).transform((v) => v.sha), z.string()]),
      verification: z
        .object({
          verified: z.boolean(),
          reason: z.string(),
          payload: z.string().optional(),
          signature: z.string().optional()
        })
        .optional()
    }),
    author: z.union([userSchema, z.string()]).optional(),
    committer: z.union([userSchema, z.string()]).optional(),
    parents: z.union([z.array(z.object({ sha: z.string() }).transform((v) => v.sha)), z.array(z.string())]).optional(),
    stats: z
      .object({
        additions: z.number().int().optional(),
        deletions: z.number().int().optional(),
        total: z.number().int().optional()
      })
      .optional(),
    files: z
      .array(
        z.object({
          sha: z.string(),
          filename: z.string(),
          status: z.enum(['added', 'removed', 'modified', 'renamed', 'copied', 'changed', 'unchanged']),
          additions: z.number().int(),
          deletions: z.number().int(),
          changes: z.number().int(),
          patch: z.string().optional(),
          previous_filename: z.string().optional()
        })
      )
      .optional()
  })
);
