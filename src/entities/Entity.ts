import objectHash from 'object-hash';
import { Constructor } from 'type-fest';
import { AnyZodObject, z } from 'zod';
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
export abstract class Entity<T extends z.ZodType = AnyZodObject> {
  protected static schema: z.ZodType;

  abstract get id(): string;
  readonly obtained_at!: Date;

  readonly data!: z.infer<T>;

  constructor(data: Record<string, any>) {
    this.data = (this.constructor as typeof Entity).schema.parse(data);
    this.obtained_at = new Date();
  }

  public static from(data: Record<string, any>) {
    return new (this.prototype.constructor as Constructor<typeof this.prototype>)(data);
  }

  public static validate(data: Record<string, any>): boolean {
    return this.schema.safeParse(data).success;
  }
}

/**
 * Represents a user entity.
 */
export class User extends Entity<typeof user> {
  protected static schema = user;

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents a repository entity.
 */
export class Repository extends Entity<typeof repository> {
  protected static schema = repository;

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents an abstract repository resource.
 */
export abstract class RepositoryResource<T extends z.ZodType = AnyZodObject> extends Entity<T> {
  readonly repository: string;

  constructor(data: Record<string, any>, props: { repository: string }) {
    if (!z.object({ repository: z.string() }).safeParse(props).success) throw new Error('Invalid props');
    super(data);
    this.repository = props.repository;
  }
}

/**
 * Represents a reactable entity.
 */
export interface Reactable extends RepositoryResource {
  hasReactions: () => boolean;
  reactions: Reaction[];
}

/**
 * Represents a tag entity.
 */
export class Tag extends RepositoryResource<typeof tag> {
  protected static schema = tag;

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents a release entity.
 */
export class Release extends RepositoryResource<typeof release> implements Reactable {
  protected static schema = release;

  reactions: Reaction[] = [];
  hasReactions: () => boolean = () => (this.data.reactions?.total_count || 0) > 0;

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents a watcher entity.
 */
export class Watcher extends RepositoryResource<typeof watcher> {
  protected static schema = watcher;

  get id() {
    return `${this.repository}_${typeof this.data.user === 'string' ? this.data.user : this.data.user.node_id}`;
  }
}

/**
 * Represents a stargazer entity.
 */
export class Stargazer extends RepositoryResource<typeof stargazer> {
  protected static schema = stargazer;

  get id() {
    return `${this.repository}_${typeof this.data.user === 'string' ? this.data.user : this.data.user.node_id}`;
  }
}

/**
 * Represents an issue entity.
 */
export class Issue<I extends typeof issue = typeof issue> extends RepositoryResource<I> implements Reactable {
  protected static schema = issue;

  events: TimelineEvent[] = [];

  hasReactions: () => boolean = () => (this.data.reactions?.total_count || 0) > 0;
  reactions: Reaction[] = [];

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents a pull request entity.
 */
export class PullRequest extends Issue<typeof pr> {
  protected static schema = pr;

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents a reaction entity.
 */
export class Reaction extends RepositoryResource<typeof reaction> {
  protected static schema = reaction;

  readonly reactable_name!: string;
  readonly reactable_id!: string;

  constructor(data: Record<string, any>, props: { repository: string; reactable_name: string; reactable_id: string }) {
    if (!z.object({ reactable_name: z.string(), reactable_id: z.string() }).safeParse(props).success)
      throw new Error('Invalid props');
    super(data, props);
    this.reactable_name = props.reactable_name;
    this.reactable_id = props.reactable_id;
  }

  get id() {
    return this.data.node_id;
  }
}

/**
 * Represents a timeline event entity.
 */
export class TimelineEvent extends RepositoryResource<typeof events> implements Reactable {
  protected static schema = events;

  readonly issue!: string;

  hasReactions: () => boolean = () => ((this.data as any).reactions?.total_count || 0) > 0;
  reactions: Reaction[] = [];

  constructor(data: Record<string, any>, props: { repository: string; issue: string }) {
    if (!z.object({ issue: z.string() }).safeParse(props).success) throw new Error('Invalid props');
    super(data, props);
    this.issue = props.issue;
  }

  get id() {
    return `${this.repository}_${this.issue}_${(this.data as any).node_id || (this.data as any).id || (this.data as any).created_at || objectHash(this.data)}`;
  }
}
