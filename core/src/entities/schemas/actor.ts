import { z } from 'zod';
import { zodSanitize } from '../../helpers/sanitize.js';

const actor = z.object({
  id: z.string(),
  login: z.string(),
  avatar_url: z.string(),
  type: z.enum(['User', 'Organization', 'Bot', 'Mannequin', 'EnterpriseUserAccount'])
});

const bot = actor.merge(z.object({ type: z.literal('Bot') })).merge(
  z
    .object({
      created_at: z.coerce.date(),
      database_id: z.number().int().optional(),
      updated_at: z.coerce.date()
    })
    .partial()
);

const user = actor.merge(z.object({ type: z.literal('User') })).merge(
  z
    .object({
      bio: z.string().optional(),
      company: z.string().optional(),
      created_at: z.coerce.date(),
      database_id: z.number().int().optional(),
      email: z.string().optional(),
      has_sponsors_listing: z.boolean(),
      is_bounty_hunter: z.boolean(),
      is_campus_expert: z.boolean(),
      is_developer_program_member: z.boolean(),
      is_employee: z.boolean(),
      is_git_hub_star: z.boolean(),
      is_hireable: z.boolean(),
      is_site_admin: z.boolean(),
      location: z.string().optional(),
      name: z.string().optional(),
      pronouns: z.string().optional(),
      social_accounts: z.record(z.string()).optional(),
      twitter_username: z.string().optional(),
      updated_at: z.coerce.date(),
      website_url: z.string().optional(),

      followers_count: z.number().int(),
      following_count: z.number().int(),
      gists_count: z.number().int(),
      issues_count: z.number().int(),
      lists_count: z.number().int(),
      organizations_count: z.number().int(),
      packages_count: z.number().int(),
      pinned_items_count: z.number().int(),
      projects_count: z.number().int(),
      pull_requests_count: z.number().int(),
      repositories_count: z.number().int(),
      repositories_contributed_to_count: z.number().int(),
      repository_discussions_count: z.number().int(),
      sponsoring_count: z.number().int(),
      sponsors_count: z.number().int(),
      starred_repositories_count: z.number().int(),
      watching_count: z.number().int()
    })
    .partial()
);

const mannequin = actor.merge(z.object({ type: z.literal('Mannequin') })).merge(
  z
    .object({
      type: z.literal('Mannequin'),
      claimant: z.union([z.string(), user]),
      created_at: z.coerce.date(),
      database_id: z.number().int().optional(),
      email: z.string().optional(),
      updated_at: z.coerce.date()
    })
    .partial()
);

const enterprise = actor.merge(z.object({ type: z.literal('EnterpriseUserAccount') })).merge(
  z
    .object({
      name: z.string(),
      updated_at: z.coerce.date(),
      user: z.union([z.string(), user])
    })
    .partial()
);

const organization = actor.merge(z.object({ type: z.literal('Organization') })).merge(
  z
    .object({
      archived_at: z.coerce.date().optional(),
      created_at: z.coerce.date(),
      database_id: z.number().int().optional(),
      description: z.string().optional(),
      email: z.string().optional(),
      has_sponsors_listing: z.boolean(),
      is_verified: z.boolean(),
      location: z.string().optional(),
      name: z.string().optional(),
      twitter_username: z.string().optional(),
      updated_at: z.coerce.date(),
      website_url: z.string().optional(),

      members_with_role_count: z.number().int(),
      packages_count: z.number().int(),
      pinned_items_count: z.number().int(),
      projects_count: z.number().int(),
      repositories_count: z.number().int(),
      sponsoring_count: z.number().int(),
      sponsors_count: z.number().int(),
      teams_count: z.number().int()
    })
    .partial()
);

export default zodSanitize(z.discriminatedUnion('type', [user, bot, mannequin, enterprise, organization]));
