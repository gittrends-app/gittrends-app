import omit from 'lodash/omit.js';
import omitBy from 'lodash/omitBy.js';
import { Collection, Db, WithId } from 'mongodb';
import objectHash from 'object-hash';
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
} from '../entities/entity.js';
import { extract } from '../helpers/extract.js';
import { Storage } from './index.js';

/**
 *  Implementation of a generic storage.
 */
function storage<T extends Entity>(collection: Collection, key: (obj: T) => string): Storage<T> {
  return {
    get: async (query: object) => {
      return collection.findOne<WithId<T>>(query).then((data) => omit(data, '_id') as unknown as T);
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
                    filter: { _id: key(item) as any },
                    replacement: item,
                    upsert: true
                  }
                }
              : {
                  insertOne: {
                    document: { _id: key(item) as any, ...item }
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
          deleteOne: { filter: { _id: key(item) as any } }
        }))
      );
    },
    invalidate: async (query) => {
      await collection.bulkWrite(
        (Array.isArray(query) ? query : [query]).map((item) => ({
          updateOne: {
            filter: { _id: key(item) as any },
            update: { $set: { __removed_at: new Date() } }
          }
        }))
      );
    }
  };
}

/**
 * Create a MongoDB storage.
 */
export default function (db: Db) {
  const usersStorage = storage<User>(db.collection('users'), (v) => v.node_id);
  const reactionsStorage = storage<Reaction>(db.collection('reactions'), (v) => v.node_id);

  const timelineStorage = storage<TimelineEvent>(
    db.collection('timeline'),
    (v: any) => v.node_id || v.id || objectHash(omitBy(v, (_, k) => k.startsWith('__')))
  );

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
          Array.isArray(entity.__timeline)
            ? memo.concat(entity.__timeline as Array<TimelineEvent>)
            : memo,
        []
      );

      const data = (Array.isArray(entities) ? entities : [entities]).map((entity) => ({
        ...entity,
        __timeline:
          entity.__timeline && Array.isArray(entity.__timeline)
            ? entity.__timeline.length
            : entity.__timeline
      }));

      await Promise.all([timelineStorage.save(events, false), saveEntity(data, replace)]);
    };

    return storage;
  };

  return {
    users: usersStorage,
    repos: withEntities(storage<Repository>(db.collection('repos'), (v) => v.node_id)),
    watchers: withEntities(
      storage<Watcher>(
        db.collection('watchers'),
        (v) => `${v.__repository}__${typeof v.user === 'number' ? v.user : v.user.id}`
      )
    ),
    stargazers: withEntities(
      storage<Stargazer>(
        db.collection('stargazers'),
        (v) => `${v.__repository}__${typeof v.user === 'number' ? v.user : v.user.id}`
      )
    ),
    tags: withEntities(storage<Tag>(db.collection('tags'), (v) => v.node_id)),
    releases: withEntities(storage<Release>(db.collection('releases'), (v) => v.node_id)),
    issues: withEntities(
      withTimeline(storage<Issue | PullRequest>(db.collection('issues'), (v) => v.node_id))
    )
  };
}
