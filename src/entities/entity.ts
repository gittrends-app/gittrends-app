import omitBy from 'lodash/omitBy.js';
import objectHash from 'object-hash';
import { z, ZodType } from 'zod';
import events from './schemas/events.js';
import issue from './schemas/issue.js';
import pr from './schemas/pull_request.js';
import reaction from './schemas/reaction.js';
import release from './schemas/release.js';
import repository from './schemas/repository.js';
import stargazer from './schemas/stargazer.js';
import tag from './schemas/tag.js';
import user from './schemas/user.js';
import watcher from './schemas/watcher.js';

const entitySchema = z.object({
  __id: z.string(),
  __typename: z.enum([
    'Issue',
    'PullRequest',
    'Reaction',
    'Release',
    'Repository',
    'Stargazer',
    'Tag',
    'TimelineEvent',
    'User',
    'Watcher'
  ]),
  __obtained_at: z.date()
});

/**
 * Create a schema for a specific entity type
 */
function createSchema<T extends string, Z extends ZodType>(
  name: T | [T, T],
  schema: Z,
  key: (v: z.infer<Z>) => string
) {
  return (value: Record<string, any>) =>
    entitySchema
      .merge(
        z.object({
          __typename: Array.isArray(name)
            ? z.union([z.literal(name[0]), z.literal(name[1])])
            : z.literal(name)
        })
      )
      .and(schema)
      .parse({
        __id: key(value),
        __typename: Array.isArray(name) ? name[0] : name,
        __obtained_at: new Date(),
        ...value
      });
}

const resourceSchema = z.object({ __repository: z.string() });

const issueSchema = resourceSchema.merge(
  z.object({
    __timeline: z.array(z.union([events, z.string()])).default([])
  })
);

const reactableSchema = resourceSchema.merge(
  z.object({
    __reactable_name: z.string(),
    __reactable_id: z.union([z.string(), z.string()])
  })
);

export const schemas = {
  user: createSchema('User', user, (v) => v.node_id),
  repo: createSchema('Repository', repository, (v) => v.node_id),
  tag: createSchema('Tag', resourceSchema.and(tag), (v) => v.node_id),
  release: createSchema('Release', resourceSchema.and(release), (v) => v.node_id),
  watcher: createSchema(
    'Watcher',
    resourceSchema.and(watcher),
    (v) => `${v.__repository}__${typeof v.user === 'string' ? v.user : v.user.node_id}`
  ),
  stargazer: createSchema(
    'Stargazer',
    resourceSchema.and(stargazer),
    (v) => `${v.__repository}__${typeof v.user === 'string' ? v.user : v.user.node_id}`
  ),
  issue: createSchema(['Issue', 'PullRequest'], issueSchema.and(issue), (v) => v.node_id),
  pull_request: createSchema('PullRequest', issueSchema.and(pr), (v) => v.node_id),
  timeline_event: createSchema(
    'TimelineEvent',
    resourceSchema.merge(z.object({ __issue: z.string() })).and(events),
    (v: any) =>
      `${v.__repository}__${v.__issue}__${v.node_id || v.id || v.created_at || objectHash(omitBy(v, (_, k) => k.startsWith('__')))}`
  ),
  reaction: createSchema('Reaction', reactableSchema.and(reaction), (v) => v.node_id)
} satisfies Record<
  string,
  (value: Record<string, any>, repo?: string | number) => z.infer<typeof entitySchema>
>;

export type RepositoryResource = z.infer<typeof resourceSchema>;

export type Entity = z.infer<typeof entitySchema>;
export type User = ReturnType<typeof schemas.user>;
export type Repository = ReturnType<typeof schemas.repo>;
export type Tag = ReturnType<typeof schemas.tag>;
export type Release = ReturnType<typeof schemas.release>;
export type Watcher = ReturnType<typeof schemas.watcher>;
export type Stargazer = ReturnType<typeof schemas.stargazer>;
export type Issue = ReturnType<typeof schemas.issue>;
export type PullRequest = ReturnType<typeof schemas.pull_request>;
export type TimelineEvent = ReturnType<typeof schemas.timeline_event>;
export type Reaction = ReturnType<typeof schemas.reaction>;
