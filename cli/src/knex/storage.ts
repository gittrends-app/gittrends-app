import { Entity, EntityStorage, Issue, Metadata, Reaction, Storage, TimelineEvent, User } from '@/core/index.js';
import { extract } from '@/helpers/extract.js';
import consola from 'consola';
import { Knex } from 'knex';
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
  constructor(
    private knex: Knex,
    private Ref: Class<T>
  ) {}

  private prepare(data: Record<string, any>) {
    if (this.Ref.name === Metadata.name) {
      const fields = ['_id', '_entityname', '_obtained_at', 'entity', 'entity_id', 'updated_at'];
      return { ...pick(data, fields), payload: omit(data, fields) };
    }

    if (this.Ref.name === TimelineEvent.name) {
      const fields = ['_id', '_entityname', '_obtained_at', '_repository', '_issue', 'event'];
      return { ...pick(data, fields), payload: omit(data, fields) };
    }

    return data;
  }

  private recover(data: Record<string, any>) {
    if (!data) return data;

    if (this.Ref.name === Metadata.name) {
      return Metadata.from({
        ...data,
        ...(mapValues(data.payload, (v) => (isIsoDate(v) ? new Date(v) : v)) || {})
      });
    }

    if (this.Ref.name === TimelineEvent.name) {
      return TimelineEvent.from({ ...data, ...(data.payload || {}) });
    }

    return data;
  }

  async get(criteria: Partial<WithoutMethods<User>>) {
    return this.knex(pluralize(this.Ref.prototype._entityname))
      .where(criteria)
      .first()
      .then((user) => (user ? ((this.Ref as any).create(this.recover(user)) as T) : null));
  }
  async find(query: Partial<WithoutMethods<T>>, opts?: { limit: number; offset?: number }) {
    return this.knex(pluralize(this.Ref.prototype._entityname))
      .where(query)
      .limit(opts?.limit || 100)
      .offset(opts?.offset || 0)
      .then((data) => data.map((d) => (this.Ref as any).create(this.recover(d)) as T));
  }
  async save(data: T | T[], replace?: boolean, trx?: Knex.Transaction) {
    const transaction = trx || (await this.knex.transaction());

    let dataArr = uniqBy(Array.isArray(data) ? data : [data], '_id');
    if (!dataArr.length) return;

    if (this.Ref.name !== User.name) {
      const { data, users } = extract(dataArr);
      dataArr = data;
      await new GenericStorage(this.knex, User).save(users || [], false, transaction);
    }

    await new GenericStorage(this.knex, Reaction).save(
      dataArr.reduce(
        (memo: Reaction[], entity) =>
          (entity as any)._reactions ? memo.concat((entity as any)._reactions as Reaction[]) : memo,
        []
      ),
      true,
      transaction
    );

    const tableName = pluralize(this.Ref.prototype._entityname);

    try {
      await Promise.all(
        dataArr.map((d) => {
          const op = transaction
            .table(tableName)
            .insert(
              mapValues(this.prepare(d.toJSON()), (v) =>
                typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v
              )
            )
            .onConflict('_id');
          return replace ? op.merge() : op.ignore();
        })
      );

      await new GenericStorage(this.knex, TimelineEvent).save(
        dataArr.reduce(
          (memo: TimelineEvent[], entity) => (entity instanceof Issue ? memo.concat(entity._events) : memo),
          []
        ),
        true,
        transaction
      );

      if (!trx) await transaction.commit();
    } catch (error) {
      if (!trx) await transaction.rollback();
      consola.error(JSON.stringify(error, null, ' '));
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
