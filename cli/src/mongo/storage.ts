import { Entity, Issue, Reaction, Stargazer, TimelineEvent, User, Watcher } from '@/core/entities/Entity.js';
import { EntityStorage, Storage } from '@/core/services/index.js';
import { extract } from '@/helpers/extract.js';
import snakeCase from 'lodash/snakeCase.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';
import { Class } from 'type-fest';

/**
 * Mongo storage
 */
export class MongoStorage implements Storage {
  private readonly db: Db;

  private readonly userStorage;

  constructor(db: Db) {
    this.db = db;
    this.userStorage = this.create(User);
  }

  private async _update<T extends Entity>(entity: T): Promise<T> {
    switch (true) {
      case entity instanceof Stargazer:
      case entity instanceof Watcher:
        entity.user = (await this.userStorage.get({ _id: entity.user })) || entity.user;
        break;
    }

    return entity;
  }

  create<T extends Entity>(Entity: Class<T>): EntityStorage<T> {
    const collection = this.db.collection(pluralize(snakeCase(Entity.name)));

    return {
      get: async (params) => {
        return collection.findOne(params).then((data) => (data ? this._update((Entity as any).create(data)) : null));
      },
      find: async (params, opts) => {
        return collection
          .find(params)
          .limit(opts?.limit || Number.MAX_SAFE_INTEGER)
          .skip(opts?.offset || 0)
          .toArray()
          .then((data) => Promise.all(data.map((item) => this._update((Entity as any).create(item)))));
      },
      save: async (entities, replace) => {
        let items = Array.isArray(entities) ? entities : [entities];
        if (!items.length) return;

        if (Entity.name !== User.name) {
          const { data, users } = extract(items);
          items = data;
          await this.userStorage.save(users || [], false);
        }

        const reactions = items.reduce(
          (memo: Reaction[], entity) =>
            (entity as any)._reactions ? memo.concat((entity as any)._reactions as Reaction[]) : memo,
          []
        );

        if (reactions.length) {
          await this.create(Reaction).save(reactions, true);
        }

        const events = items.reduce(
          (memo: TimelineEvent[], entity) => (entity instanceof Issue ? memo.concat(entity._events) : memo),
          []
        );

        if (events.length) {
          await this.create(TimelineEvent).save(events, true);
        }

        await collection
          .bulkWrite(
            items.map((item) => ({
              ...(replace
                ? {
                    replaceOne: {
                      filter: { _id: item._id as any },
                      replacement: item.toJSON(),
                      upsert: true
                    }
                  }
                : {
                    insertOne: {
                      document: { _id: item._id as any, ...item.toJSON() }
                    }
                  })
            })),
            { ordered: false, ignoreUndefined: true }
          )
          .catch((error) => {
            if (error.code !== 11000) throw error;
          });
      }
    };
  }
}
