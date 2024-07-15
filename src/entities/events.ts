import { z } from 'zod';
import { createEntityFromUnion } from './entity.js';
import { repoResourceSchema } from './repository.js';
import { reactableSchema } from './shared/reactable.js';
import { userSchema } from './user.js';

const baseSchema = z
  .object({
    id: z.number().int(),
    node_id: z.string(),
    url: z.string().url(),
    actor: userSchema.optional(),
    event: z.literal('?'),
    commit_id: z.string().optional(),
    commit_url: z.string().url().optional(),
    created_at: z.coerce.date(),
    __issue_number: z.number().int()
  })
  .merge(repoResourceSchema);

const labeledEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('labeled'),
    label: z.object({ name: z.string(), color: z.string() }).transform((v) => v.name)
  })
);

const unlabeledEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('unlabeled'),
    label: z.object({ name: z.string(), color: z.string() }).transform((v) => v.name)
  })
);

const milestonedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('milestoned'),
    milestone: z.object({ title: z.string() })
  })
);

const demilestonedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('demilestoned'),
    milestone: z.object({ title: z.string() })
  })
);

const renamedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('renamed'),
    rename: z.object({ from: z.string(), to: z.string() })
  })
);

const reviewRequestedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('review_requested'),
    review_requester: userSchema,
    requested_team: z
      .object({
        id: z.number().int(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional()
      })
      .optional(),
    requested_reviewer: userSchema.optional()
  })
);

const reviewRequestedRemovedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('review_request_removed'),
    review_requester: userSchema,
    requested_team: z
      .object({
        id: z.number().int(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional()
      })
      .optional(),
    requested_reviewer: userSchema.optional()
  })
);

const reviewDismissedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('review_dismissed'),
    dismissed_review: z.object({
      state: z.string(),
      review_id: z.number().int(),
      dismissal_message: z.string().optional(),
      dismissal_commit_id: z.string().optional()
    })
  })
);

const lockedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('locked'),
    lock_reason: z.string().optional()
  })
);

const addedToProjectEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('added_to_project'),
    project_card: z
      .object({
        id: z.number().int(),
        url: z.string().url(),
        project_id: z.number().int(),
        project_url: z.string().url(),
        column_name: z.string(),
        previous_column_name: z.string().optional()
      })
      .optional()
  })
);

const movedColumnInProjectEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('moved_columns_in_project'),
    project_card: z
      .object({
        id: z.number().int(),
        url: z.string().url(),
        project_id: z.number().int(),
        project_url: z.string().url(),
        column_name: z.string(),
        previous_column_name: z.string().optional()
      })
      .optional()
  })
);

const removedFromProjectEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('removed_from_project'),
    project_card: z
      .object({
        id: z.number().int(),
        url: z.string().url(),
        project_id: z.number().int(),
        project_url: z.string().url(),
        column_name: z.string(),
        previous_column_name: z.string().optional()
      })
      .optional()
  })
);

const convertedNoteToIssueEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('converted_note_to_issue'),
    project_card: z
      .object({
        id: z.number().int(),
        url: z.string().url(),
        project_id: z.number().int(),
        project_url: z.string().url(),
        column_name: z.string(),
        previous_column_name: z.string().optional()
      })
      .optional()
  })
);

const timelineCrossReferencesEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('cross-referenced'),
    id: z.number().int().optional(),
    node_id: z.string().optional(),
    url: z.string().url().optional(),
    updated_at: z.string(),
    source: z.object({
      type: z.string().optional(),
      issue: z
        .object({
          id: z.number().int(),
          node_id: z.string(),
          number: z.number().int(),
          title: z.string(),
          repository: z.object({ id: z.number().int() }).transform((v) => v.id)
        })
        .optional()
    })
  })
);

const commitedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('committed'),
    author: z.object({
      date: z.string(),
      email: z.string(),
      name: z.string()
    }),
    committer: z.object({
      date: z.string(),
      email: z.string(),
      name: z.string()
    }),
    message: z.string(),
    tree: z.object({
      sha: z.string(),
      url: z.string().url()
    }),
    parents: z.array(
      z.object({
        sha: z.string(),
        url: z.string().url(),
        html_url: z.string().url()
      })
    ),
    verification: z.object({
      verified: z.boolean(),
      reason: z.string(),
      signature: z.string().optional(),
      payload: z.string().optional()
    }),
    html_url: z.string().url()
  })
);

const reviewedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('reviewed'),
    user: userSchema,
    body: z.string().optional(),
    state: z.string(),
    html_url: z.string().url(),
    pull_request_url: z.string().url(),
    _links: z.object({
      html: z.object({ href: z.string() }),
      pull_request: z.object({ href: z.string() })
    }),
    submitted_at: z.string().optional(),
    body_html: z.string().optional(),
    body_text: z.string().optional(),
    author_association: z.enum([
      'COLLABORATOR',
      'CONTRIBUTOR',
      'FIRST_TIMER',
      'FIRST_TIME_CONTRIBUTOR',
      'MANNEQUIN',
      'MEMBER',
      'NONE',
      'OWNER'
    ])
  })
);

const assignedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('assigned'),
    assignee: userSchema,
    assigner: userSchema.optional()
  })
);

const unassignedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('unassigned'),
    assignee: userSchema,
    assigner: userSchema.optional()
  })
);

const commentedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('commented'),
    body: z.string().optional(),
    body_text: z.string().optional(),
    body_html: z.string().optional(),
    html_url: z.string().url(),
    user: userSchema,
    updated_at: z.string(),
    issue_url: z.string().url(),
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

// const lineCommentedEventSchema = baseSchema.merge(
//   z.object({
//     comments: z
//       .array(
//         z.object({
//           url: z.string(),
//           pull_request_review_id: z.number().int().optional(),
//           id: z.number().int(),
//           node_id: z.string(),
//           diff_hunk: z.string(),
//           path: z.string(),
//           position: z.number().int().optional(),
//           original_position: z.number().int().optional(),
//           commit_id: z.string(),
//           original_commit_id: z.string(),
//           in_reply_to_id: z.number().int().optional(),
//           user: userSchema,
//           body: z.string(),
//           created_at: z.string(),
//           updated_at: z.string(),
//           html_url: z.string().url(),
//           pull_request_url: z.string().url(),
//           author_association: z.enum([
//             'COLLABORATOR',
//             'CONTRIBUTOR',
//             'FIRST_TIMER',
//             'FIRST_TIME_CONTRIBUTOR',
//             'MANNEQUIN',
//             'MEMBER',
//             'NONE',
//             'OWNER'
//           ]),
//           _links: z.object({
//             self: z.object({ href: z.string().url() }),
//             html: z.object({ href: z.string().url() }),
//             pull_request: z.object({ href: z.string().url() })
//           }),
//           start_line: z.number().int().optional().optional(),
//           original_start_line: z.number().int().optional(),
//           start_side: z.union([z.enum(['LEFT', 'RIGHT']), z.enum(['LEFT', 'RIGHT'])]).optional(),
//           line: z.number().int().optional(),
//           original_line: z.number().int().optional(),
//           side: z.enum(['LEFT', 'RIGHT']).optional(),
//           subject_type: z.enum(['line', 'file']).optional(),
//           reactions: reactableSchema.optional(),
//           body_html: z.string().optional(),
//           body_text: z.string().optional()
//         })
//       )
//       .optional()
//   })
// );

// const commitCommentedEventSchema = baseSchema.merge(
//   z.object({
//     comments: z
//       .array(
//         z.object({
//           html_url: z.string().url(),
//           url: z.string().url(),
//           id: z.number().int(),
//           node_id: z.string(),
//           body: z.string(),
//           path: z.string().optional(),
//           position: z.number().int().optional(),
//           line: z.number().int().optional(),
//           commit_id: z.string(),
//           user: userSchema.optional(),
//           created_at: z.string(),
//           updated_at: z.string(),
//           author_association: z.enum([
//             'COLLABORATOR',
//             'CONTRIBUTOR',
//             'FIRST_TIMER',
//             'FIRST_TIME_CONTRIBUTOR',
//             'MANNEQUIN',
//             'MEMBER',
//             'NONE',
//             'OWNER'
//           ]),
//           reactions: userSchema.optional()
//         })
//       )
//       .optional()
//   })
// );

// const stateChangeEventSchema = baseSchema.merge(
//   z.object({
//     state_reason: z.string().optional().optional()
//   })
// );

const mentionedEventSchema = baseSchema.merge(z.object({ event: z.literal('mentioned') }));
const subscribedEventSchema = baseSchema.merge(z.object({ event: z.literal('subscribed') }));
const unsubscribedEventSchema = baseSchema.merge(z.object({ event: z.literal('unsubscribed') }));
const closedEventSchema = baseSchema.merge(z.object({ event: z.literal('closed') }));
const reopenedEventSchema = baseSchema.merge(z.object({ event: z.literal('reopened') }));
const transferredEventSchema = baseSchema.merge(z.object({ event: z.literal('transferred') }));
const referencedEventSchema = baseSchema.merge(z.object({ event: z.literal('referenced') }));
const pinnedEventSchema = baseSchema.merge(z.object({ event: z.literal('pinned') }));
const unpinnedEventSchema = baseSchema.merge(z.object({ event: z.literal('unpinned') }));

const unlockedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('unlocked'),
    lock_reason: z.string().optional()
  })
);

export const timelineEventSchema = createEntityFromUnion(
  'TimelineEvent',
  z.discriminatedUnion('event', [
    labeledEventSchema,
    unlabeledEventSchema,
    milestonedEventSchema,
    demilestonedEventSchema,
    renamedEventSchema,
    reviewRequestedEventSchema,
    reviewRequestedRemovedEventSchema,
    reviewDismissedEventSchema,
    lockedEventSchema,
    addedToProjectEventSchema,
    movedColumnInProjectEventSchema,
    removedFromProjectEventSchema,
    convertedNoteToIssueEventSchema,
    timelineCrossReferencesEventSchema,
    commitedEventSchema,
    reviewedEventSchema,
    assignedEventSchema,
    unassignedEventSchema,
    commentedEventSchema,
    // lineCommentedEventSchema,
    // commitCommentedEventSchema,
    // stateChangeEventSchema,
    mentionedEventSchema,
    subscribedEventSchema,
    unsubscribedEventSchema,
    closedEventSchema,
    reopenedEventSchema,
    unlockedEventSchema,
    transferredEventSchema,
    referencedEventSchema,
    pinnedEventSchema,
    unpinnedEventSchema
  ])
);

export type TimelineEvent = z.infer<typeof timelineEventSchema>;

// missing:
// - automatic_base_change_failed
// - automatic_base_change_succeeded
// - base_ref_changed
// - connected
// - convert_to_draft
// - converted_to_discussion
// - deployed
// - deployment_environment_changed
// - disconnected
// - head_ref_deleted
// - head_ref_restored
// - head_ref_force_pushed
// - marked_as_duplicate
// - merged
// - ready_for_review
// - referenced
// - unmarked_as_duplicate
// - user_blocked
