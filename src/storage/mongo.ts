import omit from 'lodash/omit.js';
import { Collection, Db, WithId } from 'mongodb';
import { Entity } from '../entities/entity.js';
import { Repository } from '../entities/repository.js';
import { User } from '../entities/user.js';
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
      await collection
        .bulkWrite(
          (Array.isArray(data) ? data : [data]).map((item) => ({
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

  const wrapper = <T extends Entity>(storage: Storage<T>): Storage<T> => {
    const saveEntity = storage.save.bind(storage);

    storage.save = async function (entities, replace) {
      const { data, users } = extract(entities);
      await Promise.all([usersStorage.save(users, false), saveEntity(data, replace)]);
    };

    return storage;
  };

  return {
    users: usersStorage,
    repos: wrapper(storage<Repository>(db.collection('repos'), (v) => v.node_id))
  };
}
