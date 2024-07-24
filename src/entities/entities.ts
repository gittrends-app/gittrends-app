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

export const entityTypes = [
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
] as const;

const entitySchema = z.object({
  _id: z.string(),
  _typename: z.enum(entityTypes),
  _obtained_at: z.date()
});

/**
 * Create a schema for a specific entity type
 */
function createEntity<T extends string, Z extends ZodType>(
  name: T | [T, T],
  schema: Z,
  key: (v: z.infer<Z>) => string
) {
  return (value: Record<string, any>) =>
    entitySchema
      .merge(
        z.object({
          _typename: Array.isArray(name) ? z.union([z.literal(name[0]), z.literal(name[1])]) : z.literal(name)
        })
      )
      .and(schema)
      .parse({
        _id: key(value),
        _typename: Array.isArray(name) ? name[0] : name,
        _obtained_at: new Date(),
        ...value
      });
}

const resourceSchema = z.object({ _repository: z.string() });

const issueSchema = resourceSchema.merge(
  z.object({
    _timeline: z.array(z.union([events, z.string()])).default([])
  })
);

const reactableSchema = resourceSchema.merge(
  z.object({
    _reactable_name: z.string(),
    _reactable_id: z.union([z.string(), z.string()])
  })
);

export const entities = {
  user: createEntity('User', user, (v) => v.node_id),
  repo: createEntity('Repository', repository, (v) => v.node_id),
  tag: createEntity('Tag', resourceSchema.and(tag), (v) => v.node_id),
  release: createEntity('Release', resourceSchema.and(release), (v) => v.node_id),
  watcher: createEntity(
    'Watcher',
    resourceSchema.and(watcher),
    (v) => `${v._repository}_${typeof v.user === 'string' ? v.user : v.user.node_id}`
  ),
  stargazer: createEntity(
    'Stargazer',
    resourceSchema.and(stargazer),
    (v) => `${v._repository}_${typeof v.user === 'string' ? v.user : v.user.node_id}`
  ),
  issue: createEntity(['Issue', 'PullRequest'], issueSchema.and(issue), (v) => v.node_id),
  pull_request: createEntity('PullRequest', issueSchema.and(pr), (v) => v.node_id),
  timeline_event: createEntity(
    'TimelineEvent',
    resourceSchema.merge(z.object({ _issue: z.string() })).and(events),
    (v: any) =>
      `${v._repository}_${v._issue}_${v.node_id || v.id || v.created_at || objectHash(omitBy(v, (_, k) => k.startsWith('_')))}`
  ),
  reaction: createEntity('Reaction', reactableSchema.and(reaction), (v) => v.node_id)
} satisfies Record<string, (value: Record<string, any>, repo?: string | number) => z.infer<typeof entitySchema>>;

// Types for the entities
export type RepositoryResource = z.infer<typeof resourceSchema>;
export type Entity = z.infer<typeof entitySchema>;
export type User = ReturnType<typeof entities.user>;
export type Repository = ReturnType<typeof entities.repo>;
export type Tag = ReturnType<typeof entities.tag>;
export type Release = ReturnType<typeof entities.release>;
export type Watcher = ReturnType<typeof entities.watcher>;
export type Stargazer = ReturnType<typeof entities.stargazer>;
export type Issue = ReturnType<typeof entities.issue>;
export type PullRequest = ReturnType<typeof entities.pull_request>;
export type TimelineEvent = ReturnType<typeof entities.timeline_event>;
export type Reaction = ReturnType<typeof entities.reaction>;
