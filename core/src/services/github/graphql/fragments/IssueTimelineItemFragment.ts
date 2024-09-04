import { IssueTimelineItems, PullRequestTimelineItems } from '@octokit/graphql-schema';
import { z } from 'zod';
import timelineItem from '../../../../entities/schemas/timeline-item.js';
import { ActorFragment } from './ActorFragment.js';
import { Fragment, FragmentFactory } from './Fragment.js';

/**
 *  A fragment to get a timeline item.
 */
class TimelineItemFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  private readonly pullRequest: boolean;

  constructor(
    public alias = 'IssueTimelineItemFrag',
    opts: { factory: FragmentFactory; pullRequest?: boolean }
  ) {
    this.fragments.push(opts.factory.create(ActorFragment));
    this.pullRequest = opts.pullRequest || false;
  }

  toString(): string {
    return `
      fragment ${this.alias}_Node on Node { __typename id }

      fragment ${this.alias}_AddedToProjectEvent on AddedToProjectEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        project { id }
        projectCard { id }
        projectColumnName
      }

      fragment ${this.alias}_AssignedEvent on AssignedEvent {
        actor { ...${this.fragments[0].alias} }
        assignee { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_ClosedEvent on ClosedEvent {
        actor { ...${this.fragments[0].alias} }
        closer { ...${this.alias}_Node }
        createdAt
        stateReason
      }

      fragment ${this.alias}_CommentDeletedEvent on CommentDeletedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        deletedCommentAuthor { ...${this.fragments[0].alias} }
      }

      fragment ${this.alias}_ConnectedEvent on ConnectedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        isCrossRepository
        source { ...${this.alias}_Node }
      }

      fragment ${this.alias}_ConvertedNoteToIssueEvent on ConvertedNoteToIssueEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        project { id }
        projectCard { id }
        projectColumnName
      }

      fragment ${this.alias}_ConvertedToDiscussionEvent on ConvertedToDiscussionEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        discussion { id }
      }

      fragment ${this.alias}_CrossReferencedEvent on CrossReferencedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        isCrossRepository
        referencedAt
        source { ...${this.alias}_Node }
        willCloseTarget
      }

      fragment ${this.alias}_DemilestonedEvent on DemilestonedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        milestoneTitle
      }

      fragment ${this.alias}_DisconnectedEvent on DisconnectedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        isCrossRepository
        source { ...${this.alias}_Node }
      }

      fragment ${this.alias}_IssueComment on IssueComment {
        author { ...${this.fragments[0].alias} }
        authorAssociation
        body
        createdAt
        createdViaEmail
        databaseId
        editor { ...${this.fragments[0].alias} }
        fullDatabaseId
        includesCreatedEdit
        isMinimized
        lastEditedAt
        minimizedReason
        publishedAt
        reactions { totalCount }
        updatedAt
      }

      fragment ${this.alias}_LabeledEvent on LabeledEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        label { name }
      }

      fragment ${this.alias}_LockedEvent on LockedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        lockReason
      }

      fragment ${this.alias}_MarkedAsDuplicateEvent on MarkedAsDuplicateEvent {
        actor { ...${this.fragments[0].alias} }
        canonical { ...${this.alias}_Node }
        createdAt
        isCrossRepository
      }

      fragment ${this.alias}_MentionedEvent on MentionedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId	
      }

      fragment ${this.alias}_MilestonedEvent on MilestonedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        milestoneTitle
      }

      fragment ${this.alias}_MovedColumnsInProjectEvent on MovedColumnsInProjectEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        previousProjectColumnName
        project { id }
        projectCard { id }
        projectColumnName
      }

      fragment ${this.alias}_PinnedEvent on PinnedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_ReferencedEvent on ReferencedEvent {
        actor { ...${this.fragments[0].alias} }
        commit { id }
        commitRepository { id }
        createdAt
        isCrossRepository
        isDirectReference
      }

      fragment ${this.alias}_RemovedFromProjectEvent on RemovedFromProjectEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        project { id }
        projectColumnName
      }

      fragment ${this.alias}_RenamedTitleEvent on RenamedTitleEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        currentTitle
        previousTitle
      }

      fragment ${this.alias}_ReopenedEvent on ReopenedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        stateReason
      }

      fragment ${this.alias}_SubscribedEvent on SubscribedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_TransferredEvent on TransferredEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        fromRepository { id }
      }

      fragment ${this.alias}_UnassignedEvent on UnassignedEvent {
        actor { ...${this.fragments[0].alias} }
        assignee { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_UnlabeledEvent on UnlabeledEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        label { name }
      }

      fragment ${this.alias}_UnlockedEvent on UnlockedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_UnmarkedAsDuplicateEvent on UnmarkedAsDuplicateEvent {
        actor { ...${this.fragments[0].alias} }
        canonical { ...${this.alias}_Node }
        createdAt
        isCrossRepository
      }

      fragment ${this.alias}_UnpinnedEvent on UnpinnedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_UnsubscribedEvent on UnsubscribedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_UserBlockedEvent on UserBlockedEvent {
        actor { ...${this.fragments[0].alias} }
        blockDuration
        createdAt
      }

      ${
        this.pullRequest
          ? `
      fragment ${this.alias}_AddedToMergeQueueEvent on AddedToMergeQueueEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        enqueuer { ...${this.fragments[0].alias} }
        mergeQueue { id }
      }

      fragment ${this.alias}_AutoMergeDisabledEvent on AutoMergeDisabledEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        disabler { ...${this.fragments[0].alias} }
        reason
        reasonCode
      }

      fragment ${this.alias}_AutoMergeEnabledEvent on AutoMergeEnabledEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        enabler { ...${this.fragments[0].alias} }
      }

      fragment ${this.alias}_AutoRebaseEnabledEvent on AutoRebaseEnabledEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        enabler { ...${this.fragments[0].alias} }
      }

      fragment ${this.alias}_AutoSquashEnabledEvent on AutoSquashEnabledEvent{
        actor { ...${this.fragments[0].alias} }
        createdAt
        enabler { ...${this.fragments[0].alias} }
      }

      fragment ${this.alias}_AutomaticBaseChangeFailedEvent on AutomaticBaseChangeFailedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        newBase
        oldBase
      }

      fragment  ${this.alias}_AutomaticBaseChangeSucceededEvent on  AutomaticBaseChangeSucceededEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        newBase
        oldBase
      }

      fragment  ${this.alias}_BaseRefChangedEvent on  BaseRefChangedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        currentRefName
        databaseId
        previousRefName
      }

      fragment ${this.alias}_BaseRefDeletedEvent on BaseRefDeletedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        baseRefName
      }

      fragment ${this.alias}_BaseRefForcePushedEvent on BaseRefForcePushedEvent {
        actor { ...${this.fragments[0].alias} }
        afterCommit { id }
        beforeCommit { id }
        createdAt
        ref { name }
      }

      fragment ${this.alias}_ConvertToDraftEvent on ConvertToDraftEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_DeployedEvent on DeployedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        deployment { id }
        ref { name }
      }


      fragment ${this.alias}_DeploymentEnvironmentChangedEvent on DeploymentEnvironmentChangedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        deploymentStatus { state }
      }


      fragment ${this.alias}_HeadRefDeletedEvent on HeadRefDeletedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        headRefName
      }

      fragment ${this.alias}_HeadRefRestoredEvent on HeadRefRestoredEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_HeadRefForcePushedEvent on HeadRefForcePushedEvent {
        actor { ...${this.fragments[0].alias} }
        afterCommit { id }
        beforeCommit { id }
        createdAt
        ref { name }
      }

      fragment ${this.alias}_MergedEvent on MergedEvent {
        actor { ...${this.fragments[0].alias} }
        commit { id }
        createdAt
        mergeRefName
      }

      fragment ${this.alias}_PullRequestCommit on PullRequestCommit {
        commit { id }
      }

      fragment ${this.alias}_PullRequestCommitCommentThread on PullRequestCommitCommentThread {
        comments(first: 100) {
          nodes {
            ...${this.alias}_Node
            author { ...${this.fragments[0].alias} }
            authorAssociation
            body
            commit { id }
            createdAt
            createdViaEmail
            databaseId
            editor { ...${this.fragments[0].alias} }
            includesCreatedEdit
            isMinimized
            lastEditedAt
            minimizedReason
            path
            position
            publishedAt
            reactions { totalCount }
            updatedAt
          }
        }
        commit { id }
        path
        position
      }

      fragment ${this.alias}_Comment on Comment {
        author { ...${this.fragments[0].alias} }
        authorAssociation
        body
        createdAt
        createdViaEmail
        editor { ...${this.fragments[0].alias} }
        includesCreatedEdit
        lastEditedAt
        publishedAt
        updatedAt
      }

      fragment ${this.alias}_PullRequestReview on PullRequestReview {
        ...${this.alias}_Comment
        authorCanPushToRepository
        comments(first: 100) { nodes { ...${this.alias}_PullRequestReviewCommentFragment }  }
        commit { id }
        fullDatabaseId
        isMinimized
        minimizedReason
        reactions { totalCount }
        state
        submittedAt
      }

      fragment ${this.alias}_PullRequestReviewThread on PullRequestReviewThread {
        comments(first: 100) { nodes { ...${this.alias}_PullRequestReviewCommentFragment }  }
        diffSide
        isCollapsed
        isOutdated
        isResolved
        line
        originalLine
        originalStartLine
        path
        resolvedBy { ...${this.fragments[0].alias} }
        startDiffSide
        startLine
        subjectType
      }

      fragment ${this.alias}_PullRequestRevisionMarker on PullRequestTimelineItems {
        ... on PullRequestRevisionMarker {
      	  createdAt
      	  lastSeenCommit { id }
        }
      }

      fragment ${this.alias}_ReadyForReviewEvent on ReadyForReviewEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
      }

      fragment ${this.alias}_RemovedFromMergeQueueEvent on RemovedFromMergeQueueEvent {
        actor { ...${this.fragments[0].alias} }
        beforeCommit { id }
        createdAt
        enqueuer { ...${this.fragments[0].alias} }
        mergeQueue { id }
        reason
      }

      fragment ${this.alias}_ReviewDismissedEvent on ReviewDismissedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        databaseId
        dismissalMessage
        previousReviewState
        pullRequestCommit { commit { id } }
        review { id }
      }

      fragment ${this.alias}_ReviewRequestRemovedEvent on ReviewRequestRemovedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        requestedReviewer { ...${this.fragments[0].alias} }
      }

      fragment ${this.alias}_ReviewRequestedEvent on ReviewRequestedEvent {
        actor { ...${this.fragments[0].alias} }
        createdAt
        requestedReviewer { ...${this.fragments[0].alias} }
      }

      fragment ${this.alias}_PullRequestReviewCommentFragment on PullRequestReviewComment  {
        ...${this.alias}_Node
        ...${this.alias}_Comment

        commit { id }
        diffHunk
        draftedAt
        fullDatabaseId
        isMinimized
        line
        minimizedReason
        originalCommit { id }
        originalLine
        originalStartLine
        outdated
        path
        pullRequestReview { id }
        reactions { totalCount }
        replyTo { id }
        startLine
        state
        subjectType
      }
      `
          : ''
      }

      fragment ${this.alias} on Node {
        ...${this.alias}_Node						
        ...${this.alias}_AddedToProjectEvent
        ...${this.alias}_AssignedEvent
        ...${this.alias}_ClosedEvent
        ...${this.alias}_CommentDeletedEvent
        ...${this.alias}_ConnectedEvent
        ...${this.alias}_ConvertedNoteToIssueEvent
        ...${this.alias}_ConvertedToDiscussionEvent
        ...${this.alias}_CrossReferencedEvent
        ...${this.alias}_DemilestonedEvent
        ...${this.alias}_DisconnectedEvent
        ...${this.alias}_IssueComment
        ...${this.alias}_LabeledEvent
        ...${this.alias}_LockedEvent
        ...${this.alias}_MarkedAsDuplicateEvent
        ...${this.alias}_MentionedEvent
        ...${this.alias}_MilestonedEvent
        ...${this.alias}_MovedColumnsInProjectEvent
        ...${this.alias}_PinnedEvent
        ...${this.alias}_ReferencedEvent
        ...${this.alias}_RemovedFromProjectEvent
        ...${this.alias}_RenamedTitleEvent
        ...${this.alias}_ReopenedEvent
        ...${this.alias}_SubscribedEvent
        ...${this.alias}_TransferredEvent
        ...${this.alias}_UnassignedEvent
        ...${this.alias}_UnlabeledEvent
        ...${this.alias}_UnlockedEvent
        ...${this.alias}_UnmarkedAsDuplicateEvent
        ...${this.alias}_UnpinnedEvent
        ...${this.alias}_UnsubscribedEvent
        ...${this.alias}_UserBlockedEvent

        ${
          this.pullRequest
            ? `
        ...${this.alias}_AddedToMergeQueueEvent
        ...${this.alias}_AutoMergeDisabledEvent
        ...${this.alias}_AutoMergeEnabledEvent
        ...${this.alias}_AutoRebaseEnabledEvent 
        ...${this.alias}_AutoSquashEnabledEvent
        ...${this.alias}_AutomaticBaseChangeFailedEvent
        ...${this.alias}_AutomaticBaseChangeSucceededEvent
        ...${this.alias}_BaseRefChangedEvent
        ...${this.alias}_BaseRefDeletedEvent
        ...${this.alias}_BaseRefForcePushedEvent
        ...${this.alias}_ConvertToDraftEvent
        ...${this.alias}_DeployedEvent
        ...${this.alias}_DeploymentEnvironmentChangedEvent
        ...${this.alias}_HeadRefDeletedEvent
        ...${this.alias}_HeadRefRestoredEvent
        ...${this.alias}_HeadRefForcePushedEvent
        ...${this.alias}_MergedEvent
        ...${this.alias}_PullRequestCommit
        ...${this.alias}_PullRequestCommitCommentThread
        ...${this.alias}_PullRequestReview
        ...${this.alias}_PullRequestReviewThread
        ...${this.alias}_PullRequestRevisionMarker
        ...${this.alias}_ReadyForReviewEvent
        ...${this.alias}_RemovedFromMergeQueueEvent 
        ...${this.alias}_ReviewDismissedEvent
        ...${this.alias}_ReviewRequestRemovedEvent
        ...${this.alias}_ReviewRequestedEvent
        ...${this.alias}_PullRequestReviewCommentFragment
              `
            : ''
        }
      }
    `;
  }

  parse(data: IssueTimelineItems | PullRequestTimelineItems): z.infer<typeof timelineItem> {
    let _data: Record<string, any> = { __typename: data.__typename, id: (data as any).id };

    switch (data.__typename) {
      case 'AddedToProjectEvent':
      case 'ConvertedNoteToIssueEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId,
          project: data.project?.id,
          project_card: data.projectCard?.id,
          project_column_name: data.projectColumnName
        };
        break;
      case 'AssignedEvent':
      case 'UnassignedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          assignee: data.assignee && this.fragments[0].parse(data.assignee),
          created_at: data.createdAt
        };
        break;
      case 'ClosedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          closer: data.closer && { id: data.closer.id, __typename: data.closer.__typename },
          created_at: data.createdAt,
          state_reason: data.stateReason
        };
        break;
      case 'CommentDeletedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId,
          deleted_comment_author: data.deletedCommentAuthor?.login
        };
        break;
      case 'ConnectedEvent':
      case 'DisconnectedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          is_cross_repository: data.isCrossRepository,
          source: data.source
        };
        break;
      case 'ConvertedToDiscussionEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          discussion: data.discussion?.id
        };
        break;
      case 'CrossReferencedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          is_cross_repository: data.isCrossRepository,
          referenced_at: data.referencedAt,
          source: data.source,
          will_close_target: data.willCloseTarget
        };
        break;
      case 'DemilestonedEvent':
      case 'MilestonedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          milestone_title: data.milestoneTitle
        };
        break;
      case 'IssueComment':
        _data = {
          ..._data,
          author: data.author && this.fragments[0].parse(data.author),
          author_association: data.authorAssociation,
          body: data.body,
          created_at: data.createdAt,
          created_via_email: data.createdViaEmail,
          database_id: data.databaseId,
          editor: data.editor && this.fragments[0].parse(data.editor),
          full_database_id: data.fullDatabaseId,
          includes_created_edit: data.includesCreatedEdit,
          is_minimized: data.isMinimized,
          last_edited_at: data.lastEditedAt,
          minimized_reason: data.minimizedReason,
          published_at: data.publishedAt,
          reactions_count: data.reactions?.totalCount,
          updated_at: data.updatedAt
        };
        break;
      case 'LabeledEvent':
      case 'UnlabeledEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          label: data.label?.name
        };
        break;
      case 'LockedEvent':
      case 'UnlockedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          lock_reason: data.__typename === 'LockedEvent' && data.lockReason
        };
        break;
      case 'MarkedAsDuplicateEvent':
      case 'UnmarkedAsDuplicateEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          canonical: data.canonical,
          created_at: data.createdAt,
          is_cross_repository: data.isCrossRepository
        };
        break;
      case 'PinnedEvent':
      case 'UnpinnedEvent':
      case 'SubscribedEvent':
      case 'UnsubscribedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt
        };
        break;
      case 'UserBlockedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          block_duration: data.blockDuration,
          created_at: data.createdAt
        };
        break;
      case 'MentionedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId
        };
        break;
      case 'MovedColumnsInProjectEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId,
          previous_project_column_name: data.previousProjectColumnName,
          project: data.project?.id,
          project_card: data.projectCard?.id,
          project_column_name: data.projectColumnName
        };
        break;
      case 'ReferencedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          commit: data.commit?.id,
          commit_repository: data.commitRepository?.id,
          created_at: data.createdAt,
          is_cross_repository: data.isCrossRepository,
          is_direct_reference: data.isDirectReference
        };
        break;
      case 'RemovedFromProjectEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId,
          project: data.project?.id,
          project_column_name: data.projectColumnName
        };
        break;
      case 'RenamedTitleEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          current_title: data.currentTitle,
          previous_title: data.previousTitle
        };
        break;
      case 'ReopenedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          state_reason: data.stateReason
        };
        break;
      case 'TransferredEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          from_repository: data.fromRepository?.id
        };
        break;

      case 'AddedToMergeQueueEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          enqueuer: data.enqueuer && this.fragments[0].parse(data.enqueuer),
          merge_queue: data.mergeQueue?.id
        };
        break;
      case 'AutoMergeDisabledEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          disabler: data.disabler && this.fragments[0].parse(data.disabler),
          reason: data.reason,
          reason_code: data.reasonCode
        };
        break;
      case 'AutoMergeEnabledEvent':
      case 'AutoRebaseEnabledEvent':
      case 'AutoSquashEnabledEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          enabler: data.enabler && this.fragments[0].parse(data.enabler)
        };
        break;
      case 'AutomaticBaseChangeFailedEvent':
      case 'AutomaticBaseChangeSucceededEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          new_base: data.newBase,
          old_base: data.oldBase
        };
        break;
      case 'BaseRefChangedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          current_ref_name: data.currentRefName,
          database_id: data.databaseId,
          previous_ref_name: data.previousRefName
        };
        break;
      case 'BaseRefDeletedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          base_ref_name: data.baseRefName,
          created_at: data.createdAt
        };
        break;
      case 'BaseRefForcePushedEvent':
      case 'HeadRefForcePushedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          after_commit: data.afterCommit?.oid,
          before_commit: data.beforeCommit?.oid,
          created_at: data.createdAt,
          ref: data.ref?.name
        };
        break;
      case 'ConvertToDraftEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt
        };
        break;
      case 'DeployedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId,
          deployment: data.deployment?.id,
          ref: data.ref?.name
        };
        break;
      case 'DeploymentEnvironmentChangedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          deployment_status: data.deploymentStatus?.state
        };
        break;
      case 'HeadRefDeletedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          head_ref_name: data.headRefName
        };
        break;
      case 'HeadRefRestoredEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt
        };
        break;
      case 'MergedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          commit: data.commit?.oid,
          created_at: data.createdAt,
          merge_ref_name: data.mergeRefName
        };
        break;
      case 'PullRequestCommit':
        _data = {
          ..._data,
          commit: data.commit?.oid
        };
        break;
      case 'PullRequestCommitCommentThread':
        _data = {
          ..._data,
          comments: data.comments?.nodes?.map((node) => ({
            author: node!.author && this.fragments[0].parse(node!.author),
            author_association: node!.authorAssociation,
            body: node!.body,
            created_at: node!.createdAt,
            created_via_email: node!.createdViaEmail,
            editor: node!.editor && this.fragments[0].parse(node!.editor),
            includes_created_edit: node!.includesCreatedEdit,
            last_edited_at: node!.lastEditedAt,
            published_at: node!.publishedAt,
            updated_at: node!.updatedAt,
            commit: node!.commit?.oid,
            database_id: node!.databaseId,
            id: node!.id,
            is_minimized: node!.isMinimized,
            minimized_reason: node!.minimizedReason,
            path: node!.path,
            position: node!.position,
            reactions_count: node!.reactions?.totalCount,
            __typename: node!.__typename
          })),
          commit: data.commit?.oid,
          path: data.path,
          position: data.position
        };
        break;
      case 'PullRequestReview':
        _data = {
          ..._data,
          author_can_push_to_repository: data.authorCanPushToRepository,
          comments: data.comments?.nodes?.map((node) => ({
            author: node!.author && this.fragments[0].parse(node!.author),
            author_association: node!.authorAssociation,
            body: node!.body,
            created_at: node!.createdAt,
            created_via_email: node!.createdViaEmail,
            editor: node!.editor && this.fragments[0].parse(node!.editor),
            includes_created_edit: node!.includesCreatedEdit,
            last_edited_at: node!.lastEditedAt,
            published_at: node!.publishedAt,
            updated_at: node!.updatedAt,

            commit: node!.commit?.oid,
            diff_hunk: node!.diffHunk,
            drafted_at: node!.draftedAt,
            full_database_id: node!.fullDatabaseId,
            id: node!.id,
            is_minimized: node!.isMinimized,
            line: node!.line,
            minimized_reason: node!.minimizedReason,
            original_commit: node!.originalCommit?.oid,
            original_line: node!.originalLine,
            original_start_line: node!.originalStartLine,
            outdated: node!.outdated,
            path: node!.path,
            pull_request_review: node!.pullRequestReview?.id,
            reactions_count: node!.reactions?.totalCount,
            reply_to: node!.replyTo?.id,
            start_line: node!.startLine,
            state: node!.state,
            subject_type: node!.subjectType,
            __typename: node!.__typename
          })),
          commit: data.commit?.oid,
          full_database_id: data.fullDatabaseId,
          is_minimized: data.isMinimized,
          minimized_reason: data.minimizedReason,
          reactions_count: data.reactions?.totalCount,
          state: data.state,
          submitted_at: data.submittedAt,

          author: data.author && this.fragments[0].parse(data.author),
          author_association: data.authorAssociation,
          body: data.body,
          created_at: data.createdAt,
          created_via_email: data.createdViaEmail,
          editor: data.editor && this.fragments[0].parse(data.editor),
          includes_created_edit: data.includesCreatedEdit,
          last_edited_at: data.lastEditedAt,
          published_at: data.publishedAt,
          updated_at: data.updatedAt
        };
        break;
      case 'PullRequestReviewThread':
        _data = {
          ..._data,
          comments: data.comments?.nodes?.map((node) => ({
            author: node!.author && this.fragments[0].parse(node!.author),
            author_association: node!.authorAssociation,
            body: node!.body,
            created_at: node!.createdAt,
            created_via_email: node!.createdViaEmail,
            editor: node!.editor && this.fragments[0].parse(node!.editor),
            includes_created_edit: node!.includesCreatedEdit,
            last_edited_at: node!.lastEditedAt,
            published_at: node!.publishedAt,
            updated_at: node!.updatedAt,

            commit: node!.commit?.oid,
            diff_hunk: node!.diffHunk,
            drafted_at: node!.draftedAt,
            full_database_id: node!.fullDatabaseId,
            id: node!.id,
            is_minimized: node!.isMinimized,
            line: node!.line,
            minimized_reason: node!.minimizedReason,
            original_commit: node!.originalCommit?.oid,
            original_line: node!.originalLine,
            original_start_line: node!.originalStartLine,
            outdated: node!.outdated,
            path: node!.path,
            pull_request_review: node!.pullRequestReview?.id,
            reactions_count: node!.reactions?.totalCount,
            reply_to: node!.replyTo?.id,
            start_line: node!.startLine,
            state: node!.state,
            subject_type: node!.subjectType,
            __typename: node!.__typename
          })),
          diff_side: data.diffSide,
          is_collapsed: data.isCollapsed,
          is_outdated: data.isOutdated,
          is_resolved: data.isResolved,
          line: data.line,
          original_line: data.originalLine,
          original_start_line: data.originalStartLine,
          path: data.path,
          resolved_by: data.resolvedBy && this.fragments[0].parse(data.resolvedBy),
          start_diff_side: data.startDiffSide,
          start_line: data.startLine,
          subject_type: data.subjectType
        };
        break;
      case 'PullRequestRevisionMarker':
        _data = {
          ..._data,
          created_at: data.createdAt,
          last_seen_commit: data.lastSeenCommit?.oid
        };
        break;
      case 'ReadyForReviewEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt
        };
        break;
      case 'RemovedFromMergeQueueEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          before_commit: data.beforeCommit?.oid,
          created_at: data.createdAt,
          enqueuer: data.enqueuer && this.fragments[0].parse(data.enqueuer),
          merge_queue: data.mergeQueue?.id,
          reason: data.reason
        };
        break;
      case 'ReviewDismissedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          database_id: data.databaseId,
          dismissal_message: data.dismissalMessage,
          previous_review_state: data.previousReviewState,
          pull_request_commit: data.pullRequestCommit?.commit.oid,
          review: data.review?.id
        };
        break;
      case 'ReviewRequestRemovedEvent':
      case 'ReviewRequestedEvent':
        _data = {
          ..._data,
          actor: data.actor && this.fragments[0].parse(data.actor),
          created_at: data.createdAt,
          requested_reviewer: data.requestedReviewer && this.fragments[0].parse(data.requestedReviewer)
        };
        break;

      default:
        throw new Error(`Unknown timeline item type: ${data.__typename}`);
    }

    return timelineItem.parse(_data);
  }
}

/**
 *
 */
export class IssueTimelineItemFragment extends TimelineItemFragment {
  constructor(
    public alias = 'IssueTimelineItemFrag',
    opts: { factory: FragmentFactory }
  ) {
    super(alias, { ...opts, pullRequest: false });
  }
}

/**
 *
 */
export class PullRequestTimelineItemFragment extends TimelineItemFragment {
  constructor(
    public alias = 'PullTimelineItemFrag',
    opts: { factory: FragmentFactory }
  ) {
    super(alias, { ...opts, pullRequest: true });
  }
}
