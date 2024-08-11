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
import mapKeys from 'lodash/mapKeys.js';
import mapValues from 'lodash/mapValues.js';
import omit from 'lodash/omit.js';
import pick from 'lodash/pick.js';
import snakeCase from 'lodash/snakeCase.js';
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

  constructor(
    private knex: Knex,
    private ClassRef: Class<T>
  ) {
    this.tablename = pluralize(snakeCase(ClassRef.name));
  }

  private prepare(data: Entity): Record<string, any> {
    const jsonData = data.toJSON();

    if (data.constructor.name === Metadata.name) {
      const fields = ['_id', 'entity', 'entity_id', 'updated_at'];
      return { ...pick(jsonData, fields), payload: omit(jsonData, fields) };
    }

    if (data.constructor.name === TimelineEvent.name) {
      const fields = ['_id', '_repository', '_issue', 'event'];
      return { ...pick(jsonData, fields), payload: omit(jsonData, fields) };
    }

    if ([Issue.name, PullRequest.name].includes(data.constructor.name)) {
      return { ...jsonData, _type: data.constructor.name };
    }

    return jsonData;
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
      .then((data) => {
        if (!data) return null;
        else if (this.ClassRef.name === Issue.name) {
          return (data._type === 'Issue' ? Issue : PullRequest).create(this.recover(data));
        } else {
          return (this.ClassRef as unknown as typeof Entity).create(this.recover(data));
        }
      });
  }
  async find(query: Partial<WithoutMethods<T>>, opts?: { limit: number; offset?: number }) {
    const { tablename, ClassRef } = this;

    return this.knex(tablename)
      .select(`${tablename}.*`)
      .leftJoin('metadata', function () {
        // eslint-disable-next-line no-invalid-this
        this.on('metadata.entity_id', '=', `${tablename}._id`).andOnVal('metadata.entity', ClassRef.name);
      })
      .where(
        mapValues(
          mapKeys(query, (_, k) => `${tablename}.${k}`),
          (v) => (v === undefined ? null : v)
        )
      )
      .andWhereRaw('metadata.payload->>? is null', ['deleted_at'])
      .limit(opts?.limit || 100)
      .offset(opts?.offset || 0)
      .then((data) =>
        data.map((d) => {
          if (!d) return null;
          else if (this.ClassRef.name === Issue.name)
            return (d._type === 'Issue' ? Issue : PullRequest).create(this.recover(d));
          else return (this.ClassRef as unknown as typeof Entity).create(this.recover(d));
        })
      );
  }

  async count(query: Partial<WithoutMethods<T>>): Promise<number> {
    const { tablename, ClassRef } = this;

    return this.knex(tablename)
      .select(`${tablename}.*`)
      .leftJoin('metadata', function () {
        // eslint-disable-next-line no-invalid-this
        this.on('metadata.entity_id', '=', `${tablename}._id`).andOnVal('metadata.entity', ClassRef.name);
      })
      .where(
        mapValues(
          mapKeys(query, (_, k) => `${tablename}.${k}`),
          (v) => (v === undefined ? null : v)
        )
      )
      .andWhereRaw('metadata.payload->>? is null', ['deleted_at'])
      .count({ count: '*' })
      .then((data) => Number(data[0].count));
  }

  async save(data: T | T[], replace?: boolean, trx?: Knex.Transaction) {
    const transaction = trx || (await this.knex.transaction());

    let dataArr = uniqBy(Array.isArray(data) ? data : [data], '_id');
    if (!dataArr.length) return;

    if (this.ClassRef.name !== User.name) {
      const { data, users } = extract(dataArr);
      dataArr = data;
      await new GenericStorage(this.knex, User).save(users || [], false, transaction);
    }

    try {
      await Promise.all(
        dataArr.map((d) => {
          const op = transaction
            .table(this.tablename)
            .insert(
              mapValues(this.prepare(d), (v) => (typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v))
            )
            .onConflict('_id');
          return replace ? op.merge() : op.ignore();
        })
      );

      await Promise.all([
        new GenericStorage(this.knex, TimelineEvent).save(
          dataArr.reduce(
            (memo: TimelineEvent[], entity) => (entity instanceof Issue ? memo.concat(entity._events) : memo),
            []
          ),
          true,
          transaction
        ),
        new GenericStorage(this.knex, Reaction).save(
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
