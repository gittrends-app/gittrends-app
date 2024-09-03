import { z, ZodObjectDef } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import commit from './commit.js';
import reaction from './reaction.js';
import timelineItem from './timeline-item.js';

const pr = z.object({
  active_lock_reason: z.string().optional(),
  assignees: z.union([z.array(actor), z.array(z.string())]).optional(),
  author: z.union([actor, z.string()]).optional(),
  author_association: z.string().optional(),
  body: z.string().optional(),
  closed: z.boolean(),
  closed_at: z.coerce.date().optional(),
  comments_count: z.number().int(),
  created_at: z.coerce.date(),
  created_via_email: z.boolean().optional(),
  database_id: z.number().int(),
  editor: z.union([actor, z.string()]).optional(),
  full_database_id: z.coerce.number().int().optional(),
  id: z.string(),
  includes_created_edit: z.boolean().optional(),
  labels: z.array(z.string()).optional(),
  last_edited_at: z.coerce.date().optional(),
  locked: z.boolean(),
  milestone: z.string().optional(),
  number: z.number().int(),
  participants_count: z.number().int(),
  published_at: z.coerce.date().optional(),
  reactions_count: z.number().int(),
  repository: z.string(),
  state: z.string(),
  timeline_items_count: z.number().int(),
  title: z.string(),
  updated_at: z.coerce.date(),
  __typename: z.literal('PullRequest'),

  additions: z.number().int(),
  auto_merge_request: z
    .object({
      author_email: z.string().optional(),
      commit_body: z.string().optional(),
      commit_headline: z.string().optional(),
      enabled_at: z.coerce.date().optional(),
      enabled_by: z.union([z.string(), actor]).optional(),
      merge_method: z.string().optional()
    })
    .optional(),
  base_ref_name: z.string(),
  base_ref_oid: z.string(),
  base_repository: z.string(),
  can_be_rebased: z.boolean(),
  changed_files: z.number().int(),
  deletions: z.number().int(),
  files_count: z.number().int(),
  head_ref_name: z.string(),
  head_ref_oid: z.string(),
  head_repository: z.string().optional(),
  head_repository_owner: z.string().optional(),
  is_cross_repository: z.boolean(),
  is_draft: z.boolean(),
  maintainer_can_modify: z.boolean(),
  merge_commit: z.union([z.string(), commit]).optional(),
  merge_state_status: z.string(),
  mergeable: z.string(),
  merged: z.boolean(),
  merged_at: z.coerce.date().optional(),
  merged_by: z.union([actor, z.string()]).optional(),
  potential_merge_commit: z.union([z.string(), commit]).optional(),
  review_decision: z.string().optional(),
  reviews_count: z.number().int(),
  suggested_reviewers: z
    .array(
      z.object({
        is_author: z.boolean(),
        is_commenter: z.boolean(),
        reviewer: actor
      })
    )
    .optional(),
  total_comments_count: z.number().int(),

  reactions: z.array(reaction).optional(),
  timeline_items: z.array(timelineItem).optional()
});

export default zodSanitize(pr as z.ZodType<z.output<typeof pr>, ZodObjectDef, z.input<typeof pr>>);
