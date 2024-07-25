import snakeCase from 'lodash/snakeCase.js';
import { Db } from 'mongodb';
import { Class } from 'type-fest';
import { Entity, Issue, Reaction, TimelineEvent, User } from '../../entities/Entity.js';
import { extract } from '../../helpers/extract.js';
import { EntityStorage, Storage } from './storage.js';

/**
 * Mongo storage
 */
export class MongoStorage implements Storage {
  private readonly db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  create<T extends Entity>(Entity: Class<T>): EntityStorage<T> {
    const collection = this.db.collection(snakeCase(Entity.name));

    return {
      save: async (entities, replace) => {
        let items = Array.isArray(entities) ? entities : [entities];
        if (!items.length) return;

        if (Entity.name !== User.name) {
          const { data, users } = extract(items);
          items = data;
          await this.create(User).save(users || [], false);
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
