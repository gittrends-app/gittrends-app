/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable require-jsdoc */
import cloneDeepWith from 'lodash/cloneDeepWith.js';
import omit from 'lodash/omit.js';
import omitBy from 'lodash/omitBy.js';
import snakeCase from 'lodash/snakeCase.js';
import { Class, Constructor, MergeExclusive } from 'type-fest';
import { z } from 'zod';
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

/**
 * Base class for all entities.
 */
export abstract class Entity {
  protected static _schema: z.ZodType;

  public static from<T extends Entity>(data: Record<string, any>) {
    return new (this.prototype.constructor as Constructor<T>)(data);
  }

  public static validate(data: Record<string, any>): boolean {
    return this._schema.safeParse(data).success;
  }

  readonly _obtained_at!: Date;

  get _entityname() {
    return snakeCase(this.constructor.name);
  }

  abstract get _id(): string;

  constructor(data: Record<string, any>) {
    Object.assign(
      this,
      omit(
        (this.constructor as typeof Entity)._schema
          .and(z.object({ _obtained_at: z.coerce.date().optional() }))
          .parse(data),
        ['_id', '_entityname']
      )
    );
    if (!this._obtained_at) this._obtained_at = new Date();
  }

  public toJSON(): Record<string, any> {
    return {
      ...cloneDeepWith(
        omitBy(this, (_, key) => key.startsWith('_')),
        (value) => (value instanceof Entity ? value.toJSON() : undefined)
      ),
      ...z.object({ _id: z.string(), _entityname: z.string(), _obtained_at: z.coerce.date() }).parse(this)
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

  get _id() {
    return this.node_id;
  }
}

const metadataSchema = z
  .object({
    entity: z.string(),
    entity_id: z.string(),
    updated_at: z.date().optional()
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
      super({ entity: entity._entityname, entity_id: entity._id });
    } else {
      super({ entity: entity.prototype._entityname, entity_id: repository });
    }

    this.updated_at = this.updated_at || new Date();
    Object.assign(this, params);
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
    this._reactable = props.reactable._entityname;
    this._reactable_id = props.reactable._id;
  }

  get _id() {
    return this.node_id;
  }

  override toJSON() {
    return { ...super.toJSON(), _reactable_name: this._reactable, _reactable_id: this._reactable_id };
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
