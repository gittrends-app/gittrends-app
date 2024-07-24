import { Collection, Db } from 'mongodb';
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
} from '../entities/entities.js';
import { extract } from '../helpers/extract.js';
import { Storage } from './storage.js';

/**
 *  Implementation of a generic storage.
 */
function storage<T extends Entity>(collection: Collection): Storage<T> {
  return {
    get: async (query: object) => {
      return collection.findOne<T>(query);
    },
    save: async (data, replace) => {
      const items = Array.isArray(data) ? data : [data];
      if (!items.length) return;

      await collection
        .bulkWrite(
          items.map(({ _id, ...item }) => ({
            ...(replace
              ? {
                  replaceOne: {
                    filter: { _id: _id as any },
                    replacement: item,
                    upsert: true
                  }
                }
              : {
                  insertOne: {
                    document: { _id: _id as any, ...item }
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
  const usersStorage = storage<User>(db.collection('users'));
  const reactionsStorage = storage<Reaction>(db.collection('reactions'));
  const timelineStorage = storage<TimelineEvent>(db.collection('timeline'));

  const withEntities = <T extends Entity>(storage: Storage<T>): Storage<T> => {
    const saveEntity = storage.save.bind(storage);

    storage.save = async function (entities, replace) {
      const { data, users, reactions } = extract(entities);
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
        (memo: Array<TimelineEvent>, entity) =>
          Array.isArray(entity._timeline) ? memo.concat(entity._timeline as Array<TimelineEvent>) : memo,
        []
      );

      const data = (Array.isArray(entities) ? entities : [entities]).map((entity) => ({
        ...entity,
        _timeline: entity._timeline && Array.isArray(entity._timeline) ? entity._timeline.length : entity._timeline
      }));

      await Promise.all([timelineStorage.save(events, false), saveEntity(data, replace)]);
    };

    return storage;
  };

  return {
    users: usersStorage,
    repos: withEntities(storage<Repository>(db.collection('repos'))),
    watchers: withEntities(storage<Watcher>(db.collection('watchers'))),
    stargazers: withEntities(storage<Stargazer>(db.collection('stargazers'))),
    tags: withEntities(storage<Tag>(db.collection('tags'))),
    releases: withEntities(storage<Release>(db.collection('releases'))),
    issues: withEntities(withTimeline(storage<Issue | PullRequest>(db.collection('issues'))))
  };
}
