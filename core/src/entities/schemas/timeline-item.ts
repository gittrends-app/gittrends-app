import { z, ZodDiscriminatedUnionDef } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import reaction from './reaction.js';

const AddedToProjectEvent = z.object({
  __typename: z.literal('AddedToProjectEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int(),
  id: z.string(),
  project: z.string().optional(),
  project_card: z.string().optional(),
  project_column_name: z.string().optional()
});

const AssignedEvent = z.object({
  __typename: z.literal('AssignedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  assignee: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const ClosedEvent = z.object({
  __typename: z.literal('ClosedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  closer: z.object({ id: z.string(), __typename: z.string() }).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  state_reason: z.string().optional()
});

const CommentDeletedEvent = z.object({
  __typename: z.literal('CommentDeletedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  deleted_comment_author: z.union([z.string(), actor]).optional(),
  id: z.string()
});

const ConnectedEvent = z.object({
  __typename: z.literal('ConnectedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  is_cross_repository: z.boolean(),
  source: z.object({ id: z.string(), __typename: z.enum(['Issue', 'PullRequest']) }).optional()
});

const ConvertedNoteToIssueEvent = z.object({
  __typename: z.literal('ConvertedNoteToIssueEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int(),
  id: z.string(),
  project: z.string().optional(),
  project_card: z.string().optional(),
  project_column_name: z.string().optional()
});

const ConvertedToDiscussionEvent = z.object({
  __typename: z.literal('ConvertedToDiscussionEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  discussion: z.string().optional(),
  id: z.string()
});

const CrossReferencedEvent = z.object({
  __typename: z.literal('CrossReferencedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  is_cross_repository: z.boolean(),
  referenced_at: z.coerce.date(),
  source: z.object({ id: z.string(), __typename: z.enum(['Issue', 'PullRequest']) }),
  will_close_target: z.boolean()
});

const DemilestonedEvent = z.object({
  __typename: z.literal('DemilestonedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  milestone_title: z.string()
});

const DisconnectedEvent = z.object({
  __typename: z.literal('DisconnectedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  is_cross_repository: z.boolean(),
  source: z.object({ id: z.string(), __typename: z.enum(['Issue', 'PullRequest']) }).optional()
});

const IssueComment = z.object({
  __typename: z.literal('IssueComment'),
  author: z.union([z.string(), actor]).optional(),
  author_association: z.string(),
  body: z.string(),
  created_at: z.coerce.date(),
  created_via_email: z.boolean(),
  database_id: z.number().int().optional(),
  editor: z.union([z.string(), actor]).optional(),
  full_database_id: z.coerce.number().int().optional(),
  id: z.string(),
  includes_created_edit: z.boolean(),
  is_minimized: z.boolean(),
  last_edited_at: z.coerce.date().optional(),
  minimized_reason: z.string().optional(),
  published_at: z.coerce.date().optional(),
  reactions_count: z.number().int(),
  updated_at: z.coerce.date(),

  reactions: z.array(reaction).optional()
});

const LabeledEvent = z.object({
  __typename: z.literal('LabeledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  label: z.string().optional()
});

const LockedEvent = z.object({
  __typename: z.literal('LockedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  lock_reason: z.string().optional()
});

const MarkedAsDuplicateEvent = z.object({
  __typename: z.literal('MarkedAsDuplicateEvent'),
  actor: z.union([z.string(), actor]).optional(),
  canonical: z.object({ id: z.string(), __typename: z.string() }).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  is_cross_repository: z.boolean()
});

const MentionedEvent = z.object({
  __typename: z.literal('MentionedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  id: z.string()
});

const MilestonedEvent = z.object({
  __typename: z.literal('MilestonedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  milestone_title: z.string()
});

const MovedColumnsInProjectEvent = z.object({
  __typename: z.literal('MovedColumnsInProjectEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int(),
  id: z.string(),
  previous_project_column_name: z.string().optional(),
  project: z.string().optional(),
  project_card: z.string().optional(),
  project_column_name: z.string().optional()
});

const PinnedEvent = z.object({
  __typename: z.literal('PinnedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const ReferencedEvent = z.object({
  __typename: z.literal('ReferencedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  commit: z.string().optional(),
  repository: z.string().optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  is_cross_repository: z.boolean(),
  is_direct_reference: z.boolean()
});

const RemovedFromProjectEvent = z.object({
  __typename: z.literal('RemovedFromProjectEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  id: z.string(),
  project: z.string().optional(),
  project_column_name: z.string().optional()
});

const RenamedTitleEvent = z.object({
  __typename: z.literal('RenamedTitleEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  current_title: z.string(),
  id: z.string(),
  previous_title: z.string()
});

const ReopenedEvent = z.object({
  __typename: z.literal('ReopenedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  state_reason: z.string().optional()
});

const SubscribedEvent = z.object({
  __typename: z.literal('SubscribedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const TransferredEvent = z.object({
  __typename: z.literal('TransferredEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  from_repository: z.string(),
  id: z.string()
});

const UnassignedEvent = z.object({
  __typename: z.literal('UnassignedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  assignee: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const UnlabeledEvent = z.object({
  __typename: z.literal('UnlabeledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  label: z.string().optional()
});

const UnlockedEvent = z.object({
  __typename: z.literal('UnlockedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const UnmarkedAsDuplicateEvent = z.object({
  __typename: z.literal('UnmarkedAsDuplicateEvent'),
  actor: z.union([z.string(), actor]).optional(),
  canonical: z.object({ id: z.string(), __typename: z.string() }).optional(),
  created_at: z.coerce.date(),
  id: z.string(),
  is_cross_repository: z.boolean()
});

const UnpinnedEvent = z.object({
  __typename: z.literal('UnpinnedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const UnsubscribedEvent = z.object({
  __typename: z.literal('UnsubscribedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  id: z.string()
});

const UserBlockedEvent = z.object({
  __typename: z.literal('UserBlockedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  block_duration: z.coerce.date(),
  created_at: z.coerce.date(),
  id: z.string()
});

const list = z.discriminatedUnion('__typename', [
  AddedToProjectEvent,
  AssignedEvent,
  ClosedEvent,
  CommentDeletedEvent,
  ConnectedEvent,
  ConvertedNoteToIssueEvent,
  ConvertedToDiscussionEvent,
  CrossReferencedEvent,
  DemilestonedEvent,
  DisconnectedEvent,
  IssueComment,
  LabeledEvent,
  LockedEvent,
  MarkedAsDuplicateEvent,
  MentionedEvent,
  MilestonedEvent,
  MovedColumnsInProjectEvent,
  PinnedEvent,
  ReferencedEvent,
  RemovedFromProjectEvent,
  RenamedTitleEvent,
  ReopenedEvent,
  SubscribedEvent,
  TransferredEvent,
  UnassignedEvent,
  UnlabeledEvent,
  UnlockedEvent,
  UnmarkedAsDuplicateEvent,
  UnpinnedEvent,
  UnsubscribedEvent,
  UserBlockedEvent
]);

export default zodSanitize(
  list as z.ZodType<z.output<typeof list>, ZodDiscriminatedUnionDef<'__typename'>, z.input<typeof list>>
);
