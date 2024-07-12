import omitBy from 'lodash/omitBy.js';
import { z } from 'zod';
import { userSchema } from './user.js';

export const repositorySchema = z.preprocess(
  (data: any) => omitBy(data, (value) => value === null || value === ''),
  z.object({
    id: z.number().int(),
    node_id: z.string(),
    name: z.string(),
    full_name: z.string(),
    owner: userSchema,
    private: z.boolean(),
    description: z.string().optional(),
    fork: z.boolean().optional(),
    url: z.string().url().optional(),
    homepage: z.string().optional(),
    language: z.string().optional(),
    forks_count: z.number().int(),
    stargazers_count: z.number().int(),
    watchers_count: z.number().int(),
    size: z.number().int(),
    default_branch: z.string(),
    open_issues_count: z.number().int(),
    is_template: z.boolean().optional(),
    topics: z.array(z.string()).optional(),
    has_issues: z.boolean(),
    has_projects: z.boolean(),
    has_wiki: z.boolean(),
    has_pages: z.boolean(),
    has_downloads: z.boolean().optional(),
    has_discussions: z.boolean(),
    archived: z.boolean(),
    disabled: z.boolean(),
    visibility: z.string().optional(),
    pushed_at: z.coerce.date(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    allow_rebase_merge: z.boolean().optional(),
    template_repository: z
      .object({ id: z.number().int() })
      .transform((v) => v.id)
      .optional(),
    allow_squash_merge: z.boolean().optional(),
    allow_auto_merge: z.boolean().optional(),
    delete_branch_on_merge: z.boolean().optional(),
    allow_merge_commit: z.boolean().optional(),
    allow_update_branch: z.boolean().optional(),
    use_squash_pr_title_as_default: z.boolean().optional(),
    squash_merge_commit_title: z.enum(['PR_TITLE', 'COMMIT_OR_PR_TITLE']).optional(),
    squash_merge_commit_message: z.enum(['PR_BODY', 'COMMIT_MESSAGES', 'BLANK']).optional(),
    merge_commit_title: z.enum(['PR_TITLE', 'MERGE_MESSAGE']).optional(),
    merge_commit_message: z.enum(['PR_BODY', 'PR_TITLE', 'BLANK']).optional(),
    allow_forking: z.boolean().optional(),
    web_commit_signoff_required: z.boolean().optional(),
    subscribers_count: z.number().int().optional(),
    network_count: z.number().int().optional(),
    license: z
      .object({ key: z.string() })
      .transform((v) => v.key)
      .optional(),
    organization: userSchema.optional(),
    parent: z
      .object({ id: z.number().int() })
      .transform((v) => v.id)
      .optional(),
    source: z
      .object({ id: z.number().int() })
      .transform((v) => v.id)
      .optional(),
    forks: z.number().int(),
    master_branch: z.string().optional(),
    open_issues: z.number().int(),
    watchers: z.number().int(),
    code_of_conduct: z
      .object({
        url: z.string().url(),
        key: z.string(),
        name: z.string(),
        html_url: z.string().url().optional()
      })
      .optional(),
    __typename: z.literal('Repository').default('Repository'),
    __obtained_at: z.date().default(() => new Date())
  })
);

export const repositoryResourceSchema = z.object({
  __repository: z.union([z.number(), repositorySchema.transform((v) => v.id)])
});

export type Repository = z.infer<typeof repositorySchema>;
export type RepositoryResource = z.infer<typeof repositoryResourceSchema>;
