import { IssueTimelineItems } from '@octokit/graphql-schema';
import { z } from 'zod';
import timelineItem from '../../../../entities/schemas/timeline-item.js';
import { ActorFragment } from './ActorFragment.js';
import { Fragment, FragmentFactory } from './Fragment.js';

/**
 *  A fragment to get a timeline item.
 */
export class IssueTimelineItemFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  constructor(
    public alias = 'IssueTimelineItemFrag',
    opts: { factory: FragmentFactory }
  ) {
    this.fragments.push(opts.factory.create(ActorFragment));
  }

  toString(): string {
    return `
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
        closer { ...Node }
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
        source { ...Node }
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
        source { ...Node }
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
        source { ...Node }
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
        canonical { ...Node }
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
        canonical { ...Node }
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

      fragment ${this.alias}_Node on Node {
        __typename
        id
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
      }
    `;
  }

  parse(data: IssueTimelineItems): z.infer<typeof timelineItem> {
    let _data: Record<string, any> = { __typename: data.__typename, id: data.id };

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
          closer: data.closer && this.fragments[0].parse(data.closer),
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
          source: data.source && { id: data.source.id, __typename: data.source.__typename }
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
          source: data.source && { id: data.source.id, __typename: data.source.__typename },
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
          canonical: data.canonical && { id: data.canonical.id, __typename: data.canonical.__typename },
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
          repository: data.commitRepository?.id,
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
      default:
        throw new Error(`Unknown timeline item type: ${data.__typename}`);
    }

    return timelineItem.parse(_data);
  }
}
