/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
/* eslint-disable require-jsdoc */
import cloneDeepWith from 'lodash/cloneDeepWith.js';
import omitBy from 'lodash/omitBy.js';
import { Constructor } from 'type-fest';
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
  protected static _entitySchema: z.SomeZodObject;

  abstract get _id(): string;
  readonly _obtained_at!: Date;

  constructor(data: Record<string, any>) {
    Object.assign(
      this,
      (this.constructor as typeof Entity)._schema
        .and(z.object({ _obtained_at: z.coerce.date().optional() }))
        .and((this.constructor as typeof Entity)._entitySchema || z.object({}))
        .parse(data)
    );
    if (!this._obtained_at) this._obtained_at = new Date();
  }

  public static from<T extends Entity>(data: Record<string, any>) {
    return new (this.prototype.constructor as Constructor<T>)(data);
  }

  public static validate(data: Record<string, any>): boolean {
    return this._schema.safeParse(data).success;
  }

  public toJSON(): Record<string, any> {
    return {
      ...cloneDeepWith(
        omitBy(this, (_, key) => key.startsWith('_')),
        (value) => (value instanceof Entity ? value.toJSON() : undefined)
      ),
      ...z
        .object({ _id: z.string(), _obtained_at: z.coerce.date() })
        .merge((this.constructor as typeof Entity)._entitySchema || z.object({}))
        .parse(this)
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

/**
 * Represents an abstract repository resource.
 */
export abstract class RepositoryResource extends Entity {
  protected static override _entitySchema = z.object({ _repository: z.string() }).partial();

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
  protected static override _entitySchema = RepositoryResource._entitySchema.merge(
    z.object({ _reactable_name: z.string(), _reactable_id: z.string() }).partial()
  );

  readonly _reactable_name!: string;
  readonly _reactable_id!: string;

  constructor(data: Record<string, any>, props: { repository: string; reactable_name: string; reactable_id: string }) {
    super(data, props);
    this._reactable_name = props.reactable_name;
    this._reactable_id = props.reactable_id;
  }

  get _id() {
    return this.node_id;
  }

  override toJSON() {
    return { ...super.toJSON(), _reactable_name: this._reactable_name, _reactable_id: this._reactable_id };
  }
}

/**
 * Represents a timeline event entity.
 */
export type TimelineEventSchema = z.infer<typeof events>;
export interface TimelineEvent extends Record<string, unknown> {}
export class TimelineEvent extends RepositoryResource implements Reactable {
  protected static override _schema = events;
  protected static override _entitySchema = RepositoryResource._entitySchema.merge(
    z.object({ _issue: z.string() }).partial()
  );

  readonly _issue!: string;
  readonly event!: z.infer<typeof events>['event'];

  _reactions: Reaction[] = [];

  get _hasReactions() {
    return ((this.event as any).reactions?.total_count || 0) > 0;
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