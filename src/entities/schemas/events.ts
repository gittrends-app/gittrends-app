import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';
import reactableSchema from './reactable.js';
import userSchema from './user.js';

const baseSchema = z.object({
  id: z.number().int(),
  node_id: z.string(),
  url: z.string().url(),
  actor: z.union([userSchema, z.string()]).optional(),
  event: z.literal('?'),
  commit_id: z.string().optional(),
  commit_url: z.string().url().optional(),
  created_at: z.coerce.date()
});

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
    review_requester: z.union([userSchema, z.string()]),
    requested_team: z
      .object({
        id: z.number().int(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional()
      })
      .optional(),
    requested_reviewer: z.union([userSchema, z.string()]).optional()
  })
);

const reviewRequestedRemovedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('review_request_removed'),
    review_requester: z.union([userSchema, z.string()]),
    requested_team: z
      .object({
        id: z.number().int(),
        name: z.string(),
        slug: z.string(),
        description: z.string().optional()
      })
      .optional(),
    requested_reviewer: z.union([userSchema, z.string()]).optional()
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
        column_name: z.string()
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
        column_name: z.string()
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
        column_name: z.string()
      })
      .optional()
  })
);

const assignedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('assigned'),
    assignee: z.union([userSchema, z.string()]),
    assigner: z.union([userSchema, z.string()]).optional()
  })
);

const unassignedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('unassigned'),
    assignee: z.union([userSchema, z.string()]),
    assigner: z.union([userSchema, z.string()]).optional()
  })
);

const stateChangeEventSchema = baseSchema.merge(
  z.object({
    state_reason: z.string().optional().optional()
  })
);

const unlockedEventSchema = baseSchema.merge(
  z.object({
    event: z.literal('unlocked'),
    lock_reason: z.string().optional()
  })
);

// ====== NON STANDARD EVENTS ======
const commentedEventSchema = z.object({
  event: z.literal('commented'),
  url: z.string().url(),
  html_url: z.string().url(),
  issue_url: z.string().url(),
  id: z.number().int(),
  node_id: z.string(),
  user: z.union([userSchema, z.string()]),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
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
  body: z.string().optional(),
  actor: z.union([userSchema, z.string()]).optional(),
  reactions: reactableSchema.optional()
});

const timelineCrossReferencesEventSchema = z.object({
  event: z.literal('cross-referenced'),
  actor: z.union([userSchema, z.string()]),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
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
});

const commitedEventSchema = z.object({
  event: z.literal('committed'),
  sha: z.string(),
  node_id: z.string(),
  url: z.string().url(),
  html_url: z.string().url(),
  author: z.object({
    date: z.coerce.date(),
    email: z.string(),
    name: z.string()
  }),
  committer: z.object({
    date: z.coerce.date(),
    email: z.string(),
    name: z.string()
  }),
  tree: z.object({
    sha: z.string(),
    url: z.string().url()
  }),
  message: z.string(),
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
  })
});

const reviewedEventSchema = z.object({
  event: z.literal('reviewed'),
  id: z.number().int(),
  node_id: z.string(),
  user: z.union([userSchema, z.string()]),
  body: z.string().optional(),
  commit_id: z.string().optional(),
  submitted_at: z.coerce.date().optional(),
  state: z.string(),
  html_url: z.string().url(),
  pull_request_url: z.string().url(),
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
  _links: z.object({
    html: z.object({ href: z.string() }),
    pull_request: z.object({ href: z.string() })
  }),
  reactions: reactableSchema.optional()
});
// ====== NON STANDARD EVENTS ======

const base = (name: string) => baseSchema.merge(z.object({ event: z.literal(name) }));

export default zodSanitize(
  z.discriminatedUnion('event', [
    addedToProjectEventSchema,
    assignedEventSchema,
    commentedEventSchema,
    convertedNoteToIssueEventSchema,
    demilestonedEventSchema,
    labeledEventSchema,
    lockedEventSchema,
    milestonedEventSchema,
    movedColumnInProjectEventSchema,
    removedFromProjectEventSchema,
    renamedEventSchema,
    reviewDismissedEventSchema,
    reviewRequestedEventSchema,
    reviewRequestedRemovedEventSchema,
    stateChangeEventSchema,
    unassignedEventSchema,
    unlabeledEventSchema,
    unlockedEventSchema,
    // partial schemas
    commitedEventSchema,
    reviewedEventSchema,
    timelineCrossReferencesEventSchema,
    // simple schemas
    base('auto_merge_disabled'),
    base('auto_squash_enabled'),
    base('automatic_base_change_failed'),
    base('automatic_base_change_succeeded'),
    base('base_ref_changed'),
    base('closed'),
    base('connected'),
    base('convert_to_draft'),
    base('converted_to_discussion'),
    base('deployed'),
    base('deployment_environment_changed'),
    base('disconnected'),
    base('head_ref_deleted'),
    base('head_ref_force_pushed'),
    base('head_ref_restored'),
    base('marked_as_duplicate'),
    base('mentioned'),
    base('merged'),
    base('pinned'),
    base('ready_for_review'),
    base('referenced'),
    base('reopened'),
    base('subscribed'),
    base('transferred'),
    base('unmarked_as_duplicate'),
    base('unpinned'),
    base('unsubscribed'),
    base('user_blocked')
  ])
);