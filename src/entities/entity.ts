import { z, ZodType } from 'zod';
import events from './schemas/events.js';
import issue from './schemas/issue.js';
import pr from './schemas/pull_request.js';
import release from './schemas/release.js';
import repository from './schemas/repository.js';
import stargazer from './schemas/stargazer.js';
import tag from './schemas/tag.js';
import user from './schemas/user.js';

const entitySchema = z.object({
  __typename: z.enum([
    'Issue',
    'PullRequest',
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
function createSchema<T extends string, Z extends ZodType>(name: T, schema: Z) {
  return (value: Record<string, any>) =>
    entitySchema
      .merge(z.object({ __typename: z.literal(name) }))
      .and(schema)
      .parse({ __typename: name, __obtained_at: new Date(), ...value });
}

const resourceSchema = z.object({ __repository: z.number().int() });
export type RepositoryResource = z.infer<typeof resourceSchema>;

const issueSchema = resourceSchema.merge(
  z.object({
    __timeline: z.union([z.array(events), z.number()]).default([])
  })
);
const timelineEvent = resourceSchema.merge(z.object({ __issue: z.number().int() }));

export const schemas = {
  user: createSchema('User', user),
  repo: createSchema('Repository', repository),
  tag: createSchema('Tag', tag.and(resourceSchema)),
  release: createSchema('Release', release.and(resourceSchema)),
  watcher: createSchema('Watcher', user.and(resourceSchema)),
  stargazer: createSchema('Stargazer', stargazer.and(resourceSchema)),
  issue: createSchema('Issue', issue.and(issueSchema)),
  pull_request: createSchema('PullRequest', pr.and(issueSchema)),
  timeline_event: createSchema('TimelineEvent', events.and(timelineEvent))
} satisfies Record<
  string,
  (value: Record<string, any>, repo?: string | number) => z.infer<typeof entitySchema>
>;

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
