import { z, ZodDiscriminatedUnionDef } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import actor from './actor.js';
import reaction from './reaction.js';

const Node = z.object({
  id: z.string(),
  __typename: z.string()
});

const AddedToProjectEvent = Node.extend({
  __typename: z.literal('AddedToProjectEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  project: z.string().optional(),
  project_card: z.string().optional(),
  project_column_name: z.string()
});

const AssignedEvent = Node.extend({
  __typename: z.literal('AssignedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  assignee: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const ClosedEvent = Node.extend({
  __typename: z.literal('ClosedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  closer: z.object({ id: z.string(), __typename: z.string() }).optional(),
  created_at: z.coerce.date(),
  state_reason: z.string().optional()
});

const CommentDeletedEvent = Node.extend({
  __typename: z.literal('CommentDeletedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  deleted_comment_author: z.union([z.string(), actor]).optional()
});

const ConnectedEvent = Node.extend({
  __typename: z.literal('ConnectedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  is_cross_repository: z.boolean(),
  source: z.object({ id: z.string(), __typename: z.enum(['Issue', 'PullRequest']) })
});

const ConvertedNoteToIssueEvent = Node.extend({
  __typename: z.literal('ConvertedNoteToIssueEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  project: z.string().optional(),
  project_card: z.string().optional(),
  project_column_name: z.string()
});

const ConvertedToDiscussionEvent = Node.extend({
  __typename: z.literal('ConvertedToDiscussionEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  discussion: z.string().optional()
});

const CrossReferencedEvent = Node.extend({
  __typename: z.literal('CrossReferencedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  is_cross_repository: z.boolean(),
  referenced_at: z.coerce.date(),
  source: z.object({ id: z.string(), __typename: z.enum(['Issue', 'PullRequest']) }),
  will_close_target: z.boolean()
});

const DemilestonedEvent = Node.extend({
  __typename: z.literal('DemilestonedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  milestone_title: z.string()
});

const DisconnectedEvent = Node.extend({
  __typename: z.literal('DisconnectedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  is_cross_repository: z.boolean(),
  source: z.object({ id: z.string(), __typename: z.enum(['Issue', 'PullRequest']) })
});

const Comment = Node.extend({
  author: z.union([z.string(), actor]).optional(),
  author_association: z.string(),
  body: z.string(),
  created_at: z.coerce.date(),
  created_via_email: z.boolean(),
  editor: z.union([z.string(), actor]).optional(),
  includes_created_edit: z.boolean(),
  last_edited_at: z.coerce.date().optional(),
  published_at: z.coerce.date().optional(),
  updated_at: z.coerce.date()
});

const Reactable = Node.extend({
  reactions_count: z.number().int(),
  reactions: z.array(reaction).optional()
});

const Minimizable = Node.extend({
  is_minimized: z.boolean(),
  minimized_reason: z.string().optional()
});

const IssueComment = Node.merge(Comment)
  .merge(Reactable)
  .merge(Minimizable)
  .extend({
    __typename: z.literal('IssueComment'),
    database_id: z.number().int().optional(),
    full_database_id: z.coerce.number().int().optional()
  });

const LabeledEvent = Node.extend({
  __typename: z.literal('LabeledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  label: z.string()
});

const LockedEvent = Node.extend({
  __typename: z.literal('LockedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  lock_reason: z.string().optional()
});

const MarkedAsDuplicateEvent = Node.extend({
  __typename: z.literal('MarkedAsDuplicateEvent'),
  actor: z.union([z.string(), actor]).optional(),
  canonical: Node.extend({ id: z.string(), __typename: z.string() }).optional(),
  created_at: z.coerce.date(),
  is_cross_repository: z.boolean()
});

const MentionedEvent = Node.extend({
  __typename: z.literal('MentionedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional()
});

const MilestonedEvent = Node.extend({
  __typename: z.literal('MilestonedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  milestone_title: z.string()
});

const MovedColumnsInProjectEvent = Node.extend({
  __typename: z.literal('MovedColumnsInProjectEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  previous_project_column_name: z.string(),
  project: z.string().optional(),
  project_card: z.string().optional(),
  project_column_name: z.string()
});

const PinnedEvent = Node.extend({
  __typename: z.literal('PinnedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const ReferencedEvent = Node.extend({
  __typename: z.literal('ReferencedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  commit: z.string().optional(),
  commit_repository: z.string(),
  created_at: z.coerce.date(),
  is_cross_repository: z.boolean(),
  is_direct_reference: z.boolean()
});

const RemovedFromProjectEvent = Node.extend({
  __typename: z.literal('RemovedFromProjectEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  project: z.string().optional(),
  project_column_name: z.string()
});

const RenamedTitleEvent = Node.extend({
  __typename: z.literal('RenamedTitleEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  current_title: z.string(),
  previous_title: z.string()
});

const ReopenedEvent = Node.extend({
  __typename: z.literal('ReopenedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  state_reason: z.string().optional()
});

const SubscribedEvent = Node.extend({
  __typename: z.literal('SubscribedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const TransferredEvent = Node.extend({
  __typename: z.literal('TransferredEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  from_repository: z.string().optional()
});

const UnassignedEvent = Node.extend({
  __typename: z.literal('UnassignedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  assignee: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const UnlabeledEvent = Node.extend({
  __typename: z.literal('UnlabeledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  label: z.string()
});

const UnlockedEvent = Node.extend({
  __typename: z.literal('UnlockedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const UnmarkedAsDuplicateEvent = Node.extend({
  __typename: z.literal('UnmarkedAsDuplicateEvent'),
  actor: z.union([z.string(), actor]).optional(),
  canonical: Node.extend({ id: z.string(), __typename: z.string() }).optional(),
  created_at: z.coerce.date(),
  is_cross_repository: z.boolean()
});

const UnpinnedEvent = Node.extend({
  __typename: z.literal('UnpinnedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const UnsubscribedEvent = Node.extend({
  __typename: z.literal('UnsubscribedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const UserBlockedEvent = Node.extend({
  __typename: z.literal('UserBlockedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  block_duration: z.string(),
  created_at: z.coerce.date()
});

const AddedToMergeQueueEvent = Node.extend({
  __typename: z.literal('AddedToMergeQueueEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  enqueuer: z.union([z.string(), actor]).optional(),
  merge_queue: z.string().optional()
});

const AutoMergeDisabledEvent = Node.extend({
  __typename: z.literal('AutoMergeDisabledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  disabler: z.union([z.string(), actor]).optional(),
  reason: z.string().optional(),
  reason_code: z.string().optional()
});

const AutoMergeEnabledEvent = Node.extend({
  __typename: z.literal('AutoMergeEnabledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  enabler: z.union([z.string(), actor]).optional()
});

const AutoRebaseEnabledEvent = Node.extend({
  __typename: z.literal('AutoRebaseEnabledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  enabler: z.union([z.string(), actor]).optional()
});

const AutoSquashEnabledEvent = Node.extend({
  __typename: z.literal('AutoSquashEnabledEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  enabler: z.union([z.string(), actor]).optional()
});

const AutomaticBaseChangeFailedEvent = Node.extend({
  __typename: z.literal('AutomaticBaseChangeFailedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  new_base: z.string(),
  old_base: z.string()
});

const AutomaticBaseChangeSucceededEvent = Node.extend({
  __typename: z.literal('AutomaticBaseChangeSucceededEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  new_base: z.string(),
  old_base: z.string()
});

const BaseRefChangedEvent = Node.extend({
  __typename: z.literal('BaseRefChangedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  current_ref_name: z.string(),
  database_id: z.number().int().optional(),
  previous_ref_name: z.string()
});

const BaseRefDeletedEvent = Node.extend({
  __typename: z.literal('BaseRefDeletedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  base_ref_name: z.string().optional(),
  created_at: z.coerce.date()
});

const BaseRefForcePushedEvent = Node.extend({
  __typename: z.literal('BaseRefForcePushedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  after_commit: z.string().optional(),
  before_commit: z.string().optional(),
  created_at: z.coerce.date(),
  ref: z.string().optional()
});

const ConvertToDraftEvent = Node.extend({
  __typename: z.literal('ConvertToDraftEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const DeployedEvent = Node.extend({
  __typename: z.literal('DeployedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  deployment: z.string(),
  ref: z.string().optional()
});

const DeploymentEnvironmentChangedEvent = Node.extend({
  __typename: z.literal('DeploymentEnvironmentChangedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  deployment_status: z.string()
});

const HeadRefDeletedEvent = Node.extend({
  __typename: z.literal('HeadRefDeletedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  head_ref_name: z.string()
});

const HeadRefRestoredEvent = Node.extend({
  __typename: z.literal('HeadRefRestoredEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const HeadRefForcePushedEvent = Node.extend({
  __typename: z.literal('HeadRefForcePushedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  after_commit: z.string().optional(),
  before_commit: z.string().optional(),
  created_at: z.coerce.date(),
  ref: z.string().optional()
});

const MergedEvent = Node.extend({
  __typename: z.literal('MergedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  commit: z.string().optional(),
  created_at: z.coerce.date(),
  merge_ref_name: z.string()
});

const PullRequestCommit = Node.extend({
  __typename: z.literal('PullRequestCommit'),
  commit: z.string()
});

const CommitComment = Node.merge(Comment)
  .merge(Minimizable)
  .merge(Reactable)
  .extend({
    __typename: z.literal('CommitComment'),
    commit: z.string().optional(),
    database_id: z.number().int().optional(),
    path: z.string().optional(),
    position: z.number().int().optional()
  });

const PullRequestReviewComment = Node.merge(Comment)
  .merge(Reactable)
  .merge(Minimizable)
  .extend({
    __typename: z.literal('PullRequestReviewComment'),
    commit: z.string().optional(),
    diff_hunk: z.string(),
    drafted_at: z.coerce.date(),
    full_database_id: z.coerce.number().int().optional(),
    line: z.number().int().optional(),
    original_commit: z.string().optional(),
    original_line: z.number().int().optional(),
    original_start_line: z.number().int().optional(),
    outdated: z.boolean(),
    path: z.string(),
    pull_request_review: z.string().optional(),
    reply_to: z.string().optional(),
    start_line: z.number().int().optional(),
    state: z.string(),
    subject_type: z.string()
  });

const PullRequestCommitCommentThread = Node.extend({
  __typename: z.literal('PullRequestCommitCommentThread'),
  comments: z.array(CommitComment),
  commit: z.string(),
  path: z.string().optional(),
  position: z.number().int().optional()
});

const PullRequestReview = Node.merge(Comment)
  .merge(Minimizable)
  .merge(Reactable)
  .extend({
    __typename: z.literal('PullRequestReview'),
    author_can_push_to_repository: z.boolean(),
    comments: z.array(PullRequestReviewComment),
    commit: z.string().optional(),
    full_database_id: z.coerce.number().int().optional(),
    state: z.string(),
    submitted_at: z.coerce.date().optional()
  });

const PullRequestReviewThread = Node.extend({
  __typename: z.literal('PullRequestReviewThread'),
  comments: z.array(PullRequestReviewComment),
  diff_side: z.string(),
  is_collapsed: z.boolean(),
  is_outdated: z.boolean(),
  is_resolved: z.boolean(),
  line: z.number().int().optional(),
  original_line: z.number().int().optional(),
  original_start_line: z.number().int().optional(),
  path: z.string(),
  resolved_by: z.union([z.string(), actor]).optional(),
  start_diff_side: z.string().optional(),
  start_line: z.number().int().optional(),
  subject_type: z.string()
});

// const PullRequestRevisionMarker = node.extend({
//   __typename: z.literal('PullRequestRevisionMarker'),
//   created_at: z.coerce.date(),
//   last_seen_commit: z.string()
// });

const ReadyForReviewEvent = Node.extend({
  __typename: z.literal('ReadyForReviewEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date()
});

const RemovedFromMergeQueueEvent = Node.extend({
  __typename: z.literal('RemovedFromMergeQueueEvent'),
  actor: z.union([z.string(), actor]).optional(),
  before_commit: z.string().optional(),
  created_at: z.coerce.date(),
  enqueuer: z.union([z.string(), actor]).optional(),
  merge_queue: z.string().optional(),
  reason: z.string().optional()
});

const ReviewDismissedEvent = Node.extend({
  __typename: z.literal('ReviewDismissedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  database_id: z.number().int().optional(),
  dismissal_message: z.string().optional(),
  previous_review_state: z.string(),
  pull_request_commit: z.string().optional(),
  review: z.string().optional()
});

const ReviewRequestRemovedEvent = Node.extend({
  __typename: z.literal('ReviewRequestRemovedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  requested_reviewer: z.union([z.string(), actor]).optional()
});

const ReviewRequestedEvent = Node.extend({
  __typename: z.literal('ReviewRequestedEvent'),
  actor: z.union([z.string(), actor]).optional(),
  created_at: z.coerce.date(),
  requested_reviewer: z.union([z.string(), actor]).optional()
});

const list = z.discriminatedUnion('__typename', [
  AddedToMergeQueueEvent,
  AddedToProjectEvent,
  AssignedEvent,
  AutoMergeDisabledEvent,
  AutoMergeEnabledEvent,
  AutoRebaseEnabledEvent,
  AutoSquashEnabledEvent,
  AutomaticBaseChangeFailedEvent,
  AutomaticBaseChangeSucceededEvent,
  BaseRefChangedEvent,
  BaseRefDeletedEvent,
  BaseRefForcePushedEvent,
  ClosedEvent,
  CommentDeletedEvent,
  ConnectedEvent,
  ConvertToDraftEvent,
  ConvertedNoteToIssueEvent,
  ConvertedToDiscussionEvent,
  CrossReferencedEvent,
  DemilestonedEvent,
  DeployedEvent,
  DeploymentEnvironmentChangedEvent,
  DisconnectedEvent,
  HeadRefDeletedEvent,
  HeadRefForcePushedEvent,
  HeadRefRestoredEvent,
  IssueComment,
  LabeledEvent,
  LockedEvent,
  MarkedAsDuplicateEvent,
  MentionedEvent,
  MergedEvent,
  MilestonedEvent,
  MovedColumnsInProjectEvent,
  PinnedEvent,
  PullRequestCommit,
  PullRequestCommitCommentThread,
  PullRequestReview,
  PullRequestReviewThread,
  ReadyForReviewEvent,
  ReferencedEvent,
  RemovedFromMergeQueueEvent,
  RemovedFromProjectEvent,
  RenamedTitleEvent,
  ReopenedEvent,
  ReviewDismissedEvent,
  ReviewRequestRemovedEvent,
  ReviewRequestedEvent,
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
