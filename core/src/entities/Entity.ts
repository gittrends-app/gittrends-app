/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable require-jsdoc */
import cloneDeepWith from 'lodash/cloneDeepWith.js';
import omitBy from 'lodash/omitBy.js';
import { Class, MergeExclusive } from 'type-fest';
import { z } from 'zod';
import { errorMap, fromZodError } from 'zod-validation-error';
import events from './schemas/events.js';
import issue from './schemas/issue.js';
import pr from './schemas/pull_request.js';
import reaction from './schemas/reaction.js';
import release from './schemas/release.js';
import repository from './schemas/repository.js';
import stargazer from './schemas/stargazer.js';
import summary from './schemas/summary.js';
import tag from './schemas/tag.js';
import user from './schemas/user.js';
import watcher from './schemas/watcher.js';

z.setErrorMap(errorMap);

/**
 * Base class for all entities.
 */
export abstract class Entity {
  protected static _schema: z.ZodType;

  /**
   * Creates an instance without validations
   */
  public static create(data: Record<string, any>) {
    const instance = Object.create(this.prototype);

    const res = this._schema.safeParse(data);
    if (!res.success) throw Object.assign(fromZodError(res.error, { includePath: true }), { data });

    Object.entries(Object.assign({}, data, res.data)).forEach(([key, value]) => {
      try {
        Object.assign(instance, { [key]: value });
      } catch (error) {
        // do nothing
      }
    });
    return instance;
  }

  /**
   *
   */
  public static validate(data: Record<string, any>): boolean {
    return this._schema.safeParse(data).success;
  }

  abstract get _id(): string;

  constructor(data: Record<string, any>) {
    const res = (this.constructor as typeof Entity)._schema.safeParse(data);

    if (!res.success) throw Object.assign(fromZodError(res.error, { includePath: true }), { data });

    for (const [key, value] of Object.entries(res.data)) {
      try {
        Object.assign(this, { [key]: value });
      } catch (e) {
        // do nothign
      }
    }
  }

  public toJSON(): Record<string, any> {
    return {
      _id: this._id,
      ...cloneDeepWith(
        omitBy(this, (_, key) => key.startsWith('_')),
        (value) => (value instanceof Entity ? value.toJSON() : undefined)
      )
    };
  }
}

/**
 * Represents a user entity.
 */
export interface User extends z.infer<typeof user> {}
export class User extends Entity {
  protected static override _schema = user;

  get _id() {
    return this.node_id;
  }
}

/**
 * Represents a repository entity.
 */
export interface Repository extends z.infer<typeof repository> {}
export class Repository extends Entity {
  protected static override _schema = repository;

  readonly _resources_counts: z.infer<typeof summary> | undefined;

  constructor(data: Record<string, any>, props?: { counts: Record<string, number> }) {
    super(data);
    if (props?.counts) this._resources_counts = summary.parse(props.counts);
  }

  get _id() {
    return this.node_id;
  }

  public toJSON(): Record<string, any> {
    return { ...super.toJSON(), _resources_counts: this._resources_counts };
  }
}

const metadataSchema = z
  .object({
    entity: z.string(),
    entity_id: z.string(),
    updated_at: z.coerce.date().optional()
  })
  .passthrough();

/**
 * Represents a metadata entity.
 */
export interface Metadata extends z.infer<typeof metadataSchema> {}
export class Metadata extends Entity {
  protected static override _schema = metadataSchema;

  constructor(
    data: MergeExclusive<{ entity: Entity }, { entity: Class<RepositoryResource>; repository: string }> &
      Record<string, unknown>
  ) {
    const { entity, repository, ...params } = data;
    if (entity instanceof Entity) {
      super({ entity: entity.constructor.name, entity_id: entity._id, ...params });
    } else if (typeof entity === 'function') {
      super({ entity: entity.name, entity_id: repository, ...params });
    } else {
      super(data);
    }
    if (!('updated_at' in params)) this.updated_at = new Date();
  }

  get _id() {
    return `${this.entity}_${this.entity_id}`;
  }
}

/**
 * Represents an abstract repository resource.
 */
export abstract class RepositoryResource extends Entity {
  readonly _repository: string;

  constructor(data: Record<string, any>, props: { repository: string }) {
    super(data);
    this._repository = props.repository;
  }

  override toJSON() {
    return { ...super.toJSON(), _repository: this._repository };
  }
}

/**
 * Represents a reactable entity.
 */
export interface Reactable {
  _hasReactions: boolean;
  _reactions: Reaction[];
}

/**
 * Represents a tag entity.
 */
export interface Tag extends z.infer<typeof tag> {}
export class Tag extends RepositoryResource {
  protected static override _schema = tag;

  get _id() {
    return this.node_id;
  }
}

/**
 * Represents a release entity.
 */
export interface Release extends z.infer<typeof release> {}
export class Release extends RepositoryResource implements Reactable {
  protected static override _schema = release;

  _reactions: Reaction[] = [];

  get _hasReactions() {
    return (this.reactions?.total_count || 0) > 0;
  }

  get _id() {
    return this.node_id;
  }
}

/**
 * Represents a watcher entity.
 */
export interface Watcher extends z.infer<typeof watcher> {}
export class Watcher extends RepositoryResource {
  protected static override _schema = watcher;

  get _id() {
    return `${this._repository}_${typeof this.user === 'string' ? this.user : this.user.node_id}`;
  }
}

/**
 * Represents a stargazer entity.
 */
export interface Stargazer extends z.infer<typeof stargazer> {}
export class Stargazer extends RepositoryResource {
  protected static override _schema = stargazer;

  get _id() {
    return `${this._repository}_${typeof this.user === 'string' ? this.user : this.user.node_id}`;
  }
}

/**
 * Represents an issue entity.
 */

export interface Issue extends z.infer<typeof issue> {}
export class Issue extends RepositoryResource implements Reactable {
  protected static override _schema = issue;

  _events: TimelineEvent[] = [];
  _reactions: Reaction[] = [];

  get _hasReactions() {
    return (this.reactions?.total_count || 0) > 0;
  }

  get _id() {
    return this.node_id;
  }
}

/**
 * Represents a pull request entity.
 */
export interface PullRequest extends z.infer<typeof pr> {}
export class PullRequest extends Issue {
  protected static override _schema = pr;

  get _id() {
    return this.node_id;
  }
}

/**
 * Represents a reaction entity.
 */
export interface Reaction extends z.infer<typeof reaction> {}
export class Reaction extends RepositoryResource {
  protected static override _schema = reaction;

  readonly _reactable!: string;
  readonly _reactable_id!: string;

  constructor(data: Record<string, any>, props: { reactable: RepositoryResource & Reactable }) {
    super(data, { repository: props.reactable._repository });
    this._reactable = props.reactable.constructor.name;
    this._reactable_id = props.reactable._id;
  }

  get _id() {
    return this.node_id;
  }

  override toJSON() {
    return { ...super.toJSON(), _reactable: this._reactable, _reactable_id: this._reactable_id };
  }
}

/**
 * Represents a timeline event entity.
 */
export interface TimelineEvent extends Pick<z.infer<typeof events>, 'event'>, Record<string, unknown> {}
export class TimelineEvent extends RepositoryResource implements Reactable {
  protected static override _schema = events;

  readonly _issue!: string;

  _reactions: Reaction[] = [];

  get _hasReactions() {
    return ((this as any).reactions?.total_count || 0) > 0;
  }

  constructor(data: Record<string, any>, props: { repository: string; issue: string }) {
    if (!z.object({ issue: z.string() }).safeParse(props).success) throw new Error('Invalid props');
    super(data, props);
    this._issue = props.issue;
  }

  get _id() {
    const { id, node_id: nodeId, created_at: createdAt } = this;
    return `${this._repository}_${this._issue}_${nodeId || id || (createdAt as Date | undefined)?.toISOString()}`;
  }

  override toJSON() {
    return { ...super.toJSON(), _issue: this._issue };
  }
}
