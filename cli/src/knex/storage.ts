import { Entity, EntityStorage, Metadata, Storage, User } from '@/core/index.js';
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

    return data;
  }

  private recover(data: Record<string, any>) {
    if (!data) return data;

    if (this.Ref.name === Metadata.name) {
      return { ...data, ...(data.payload || {}) };
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
  async save(data: T | T[], replace?: boolean) {
    let dataArr = uniqBy(Array.isArray(data) ? data : [data], '_id').map((d) => this.prepare(d.toJSON()));
    if (!dataArr.length) return;

    if (this.Ref.name !== User.name) {
      const { data, users } = extract(dataArr);
      dataArr = data;
      await new GenericStorage(this.knex, User).save(users || [], false);
    }

    const tableName = pluralize(this.Ref.prototype._entityname);
    if (replace) {
      await this.knex(tableName)
        .delete()
        .whereIn(
          '_id',
          dataArr.map((d) => d._id)
        );
    }

    try {
      await Promise.all(
        dataArr.map((d) =>
          this.knex
            .table(tableName)
            .insert(mapValues(d, (v) => (typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v)))
            .onConflict('_id')
            .ignore()
        )
      );
    } catch (error) {
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
