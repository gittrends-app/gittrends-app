import omit from 'lodash/omit.js';
import { Collection, Db, WithId } from 'mongodb';
import objectHash from 'object-hash';
import { Entity } from '../entities/entity.js';
import { TimelineEvent } from '../entities/events.js';
import { Issue, PullRequest } from '../entities/issue.js';
import { Release } from '../entities/release.js';
import { Repository } from '../entities/repository.js';
import { Stargazer } from '../entities/stargazer.js';
import { Tag } from '../entities/tag.js';
import { User } from '../entities/user.js';
import { Watcher } from '../entities/watcher.js';
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
  const timelineStorage = storage<any>(db.collection('timeline'), (v) => objectHash(v));

  const withUser = <T extends Entity>(storage: Storage<T>): Storage<T> => {
    const saveEntity = storage.save.bind(storage);

    storage.save = async function (entities, replace) {
      const { data, users } = extract(entities);
      await Promise.all([usersStorage.save(users, false), saveEntity(data, replace)]);
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
    repos: withUser(storage<Repository>(db.collection('repos'), (v) => v.node_id)),
    watchers: withUser(
      storage<Watcher>(
        db.collection('watchers'),
        (v) => `${v.__repository}__${typeof v.user === 'number' ? v.user : v.user.id}`
      )
    ),
    stargazers: withUser(
      storage<Stargazer>(
        db.collection('stargazers'),
        (v) => `${v.__repository}__${typeof v.user === 'number' ? v.user : v.user.id}`
      )
    ),
    tags: withUser(storage<Tag>(db.collection('tags'), (v) => v.node_id)),
    releases: withUser(storage<Release>(db.collection('releases'), (v) => v.node_id)),
    issues: withUser(
      withTimeline(storage<Issue | PullRequest>(db.collection('issues'), (v) => v.node_id))
    )
  };
}
