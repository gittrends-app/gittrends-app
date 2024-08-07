import {
  Entity,
  EntityStorage,
  Issue,
  Metadata,
  PullRequest,
  Reaction,
  Storage,
  TimelineEvent,
  User
} from '@/core/index.js';
import { extract } from '@/helpers/extract.js';
import { Knex } from 'knex';
import { snakeCase } from 'lodash';
import mapValues from 'lodash/mapValues.js';
import omit from 'lodash/omit.js';
import pick from 'lodash/pick.js';
import uniqBy from 'lodash/uniqBy.js';
import pluralize from 'pluralize';
import { Class } from 'type-fest';

/**
 *
 */
function isIsoDate(str: string) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str);
  return d instanceof Date && !isNaN(d.getTime()) && d.toISOString() === str; // valid date
}

/**
 * User entity
 */
class GenericStorage<T extends Entity> implements EntityStorage<T> {
  private readonly tablename;

  private readonly userStorage: GenericStorage<User>;
  private readonly reactionsStorage: GenericStorage<Reaction>;
  private readonly timelineStorage: GenericStorage<TimelineEvent>;

  constructor(
    private knex: Knex,
    private ClassRef: Class<T>
  ) {
    this.tablename = pluralize(snakeCase(ClassRef.name));
    this.userStorage = new GenericStorage(this.knex, User);
    this.reactionsStorage = new GenericStorage(this.knex, Reaction);
    this.timelineStorage = new GenericStorage(this.knex, TimelineEvent);
  }

  private prepare(data: Record<string, any>) {
    if (this.ClassRef.name === Metadata.name) {
      const fields = ['_id', 'entity', 'entity_id', 'updated_at'];
      return { ...pick(data, fields), payload: omit(data, fields) };
    }

    if (this.ClassRef.name === TimelineEvent.name) {
      const fields = ['_id', '_repository', '_issue', 'event'];
      return { ...pick(data, fields), payload: omit(data, fields) };
    }

    if ([Issue.name, PullRequest.name].includes(this.ClassRef.name)) {
      return { ...Entity, _type: this.ClassRef.name };
    }

    return data;
  }

  private recover(data: Record<string, any>) {
    if (!data) return data;

    if (this.ClassRef.name === Metadata.name) {
      return Metadata.create({
        ...data,
        ...(mapValues(data.payload, (v) => (isIsoDate(v) ? new Date(v) : v)) || {})
      });
    }

    if (this.ClassRef.name === TimelineEvent.name) {
      return TimelineEvent.create({ ...data, ...(data.payload || {}) });
    }

    return data;
  }

  async get(criteria: Partial<WithoutMethods<User>>) {
    return this.knex(this.tablename)
      .where(criteria)
      .first()
      .then((user) => (user ? (this.ClassRef as unknown as typeof Entity).create(this.recover(user)) : null));
  }
  async find(query: Partial<WithoutMethods<T>>, opts?: { limit: number; offset?: number }) {
    return this.knex(this.tablename)
      .where(query)
      .limit(opts?.limit || 100)
      .offset(opts?.offset || 0)
      .then((data) => data.map((d) => (this.ClassRef as unknown as typeof Entity).create(this.recover(d))));
  }
  async save(data: T | T[], replace?: boolean, trx?: Knex.Transaction) {
    const transaction = trx || (await this.knex.transaction());

    let dataArr = uniqBy(Array.isArray(data) ? data : [data], '_id');
    if (!dataArr.length) return;

    if (this.ClassRef.name !== User.name) {
      const { data, users } = extract(dataArr);
      dataArr = data;
      await this.userStorage.save(users || [], false, transaction);
    }

    try {
      await Promise.all(
        dataArr.map((d) => {
          const op = transaction
            .table(this.tablename)
            .insert(
              mapValues(this.prepare(d.toJSON()), (v) =>
                typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v
              )
            )
            .onConflict('_id');
          return replace ? op.merge() : op.ignore();
        })
      );

      await Promise.all([
        this.timelineStorage.save(
          dataArr.reduce(
            (memo: TimelineEvent[], entity) => (entity instanceof Issue ? memo.concat(entity._events) : memo),
            []
          ),
          true,
          transaction
        ),
        this.reactionsStorage.save(
          dataArr.reduce(
            (memo: Reaction[], entity) =>
              (entity as any)._reactions ? memo.concat((entity as any)._reactions as Reaction[]) : memo,
            []
          ),
          true,
          transaction
        )
      ]);

      if (!trx) await transaction.commit();
    } catch (error) {
      if (!trx) await transaction.rollback();
      throw error;
    }
  }
}

/**
 * Relational storage
 */
export class RelationalStorage implements Storage {
  constructor(private knex: Knex) {}

  create<T extends Entity>(Entity: Class<T>): EntityStorage<T> {
    switch (Entity.name) {
      default:
        return new GenericStorage(this.knex, Entity) as any;
    }
  }
}
