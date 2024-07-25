import { Collection, Db } from 'mongodb';
import { Constructor } from 'type-fest';
import {
  Entity,
  Issue,
  PullRequest,
  Reaction,
  Release,
  Repository,
  Stargazer,
  Tag,
  TimelineEvent,
  User,
  Watcher
} from '../entities/Entity.js';
import { extract } from '../helpers/extract.js';
import { Storage } from './storage.js';

/**
 *  Implementation of a generic storage.
 */
function storage<T extends Entity>(collection: Collection, Class: Constructor<T>): Storage<T> {
  return {
    get: async (query: object) => {
      return new Class(collection.findOne(query));
    },
    save: async (data, replace) => {
      const items = Array.isArray(data) ? data : [data];
      if (!items.length) return;

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
    },
    remove: async (query) => {
      await collection.bulkWrite(
        (Array.isArray(query) ? query : [query]).map((item) => ({
          deleteOne: { filter: { _id: item._id as any } }
        }))
      );
    },
    invalidate: async (query) => {
      await collection.bulkWrite(
        (Array.isArray(query) ? query : [query]).map((item) => ({
          updateOne: {
            filter: { _id: item._id as any },
            update: { $set: { _removed_at: new Date() } }
          }
        }))
      );
    }
  };
}

/**
 * Create a MongoDB storage.
 */
export function createMongoStorage(db: Db) {
  const usersStorage = storage(db.collection('users'), User);
  const reactionsStorage = storage(db.collection('reactions'), Reaction);
  const timelineStorage = storage(db.collection('timeline'), TimelineEvent);

  const withEntities = <T extends Entity>(storage: Storage<T>): Storage<T> => {
    const saveEntity = storage.save.bind(storage);

    storage.save = async function (entities, replace) {
      const { data, users } = extract(entities);

      const reactions = (Array.isArray(data) ? data : [data]).reduce(
        (memo: Reaction[], entity) =>
          (entity as any)._reactions ? memo.concat((entity as any)._reactions as Reaction[]) : memo,
        []
      );

      await Promise.all([
        users && usersStorage.save(users, false),
        reactions && reactionsStorage.save(reactions, false),
        saveEntity(data, replace)
      ]);
    };

    return storage;
  };

  const withTimeline = <T extends Issue>(storage: Storage<T>): Storage<T> => {
    const saveEntity = storage.save.bind(storage);

    storage.save = async function (entities, replace) {
      const events = (Array.isArray(entities) ? entities : [entities]).reduce(
        (memo: Array<TimelineEvent>, entity) => memo.concat(entity.events),
        []
      );

      await Promise.all([timelineStorage.save(events, false), saveEntity(entities, replace)]);
    };

    return storage;
  };

  return {
    users: usersStorage,
    repos: withEntities(storage(db.collection('repos'), Repository)),
    watchers: withEntities(storage(db.collection('watchers'), Watcher)),
    stargazers: withEntities(storage(db.collection('stargazers'), Stargazer)),
    tags: withEntities(storage(db.collection('tags'), Tag)),
    releases: withEntities(storage(db.collection('releases'), Release)),
    issues: withEntities(withTimeline(storage<Issue | PullRequest>(db.collection('issues'), Issue)))
  };
}
