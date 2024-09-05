import { Node } from '@/core/entities/base/Node.js';
import { RepositoryNode, RepositoryNodeSchema } from '@/core/entities/base/RepositoryNode.js';
import {
  Actor,
  ActorSchema,
  NodeStorage,
  RepositoryNodeStorage,
  RepositorySchema,
  StargazerSchema,
  StorageFactory,
  TagSchema,
  Watcher,
  WatcherSchema
} from '@/core/index.js';
import { extract } from '@/helpers/extract.js';
import { Db, ObjectId } from 'mongodb';
import objectHash from 'object-hash';
import { ZodType } from 'zod';

const Schemas = {
  Actor: ActorSchema,
  Repository: RepositorySchema,
  Watcher: WatcherSchema,
  Stargazer: StargazerSchema,
  Tag: TagSchema,
  Metadata: RepositoryNodeSchema.passthrough()
};

/**
 *  Get the id of a node.
 */
function getId(node: (Node | RepositoryNode) & Record<string, any>): ObjectId {
  if (node.id) return node.id;

  const clone = { ...node };
  delete clone._id;
  return objectHash(clone) as unknown as ObjectId;
}

/**
 * MongoDB storage factory.
 */
export class MongoStorageFactory implements StorageFactory {
  private db: Db;

  private actorStorage: NodeStorage<Actor>;

  constructor(db: Db) {
    this.db = db;
    this.actorStorage = this.nodeStorage('Actor');
  }

  nodeStorage<T extends Node>(typename: string): NodeStorage<T> {
    if (!(typename in Schemas)) throw new Error(`Schema not found for ${typename}`);

    const Schema = Schemas[typename as keyof typeof Schemas] as unknown as ZodType<T>;

    return {
      count: (query) => {
        return this.db.collection(typename).countDocuments(query);
      },
      find: async (query, options) => {
        const data = await this.db
          .collection(typename)
          .find(query)
          .limit(options?.limit || 100)
          .skip(options?.offset || 0)
          .sort({ _id: 1 })
          .toArray();

        return data.map((item) => Schema.parse(item));
      },
      get: async (id) => {
        const data = await this.db.collection(typename).findOne(id);
        return data ? Schema.parse(data) : null;
      },
      save: async (node, replace) => {
        let arrNode = Array.isArray(node) ? node : [node];
        if (arrNode.length === 0) return;

        if (typename !== 'Actor') {
          const { data, refs } = extract(arrNode, ActorSchema, (d) => d.id);
          arrNode = data;
          await this.actorStorage.save(refs, replace);
        }

        await this.db
          .collection(typename)
          .bulkWrite(
            arrNode.map((item) =>
              replace
                ? { replaceOne: { filter: { _id: getId(item) }, replacement: item, upsert: true } }
                : { insertOne: { document: { _id: getId(item), ...item } } }
            )
          )
          .catch((err) => {
            if (err.code === 11000) return;
            throw err;
          });
      }
    };
  }

  repoNodeStorage<T extends RepositoryNode = Watcher>(typename: 'Watcher'): RepositoryNodeStorage<T>;
  repoNodeStorage<T extends RepositoryNode>(typename: string): RepositoryNodeStorage<T> {
    if (!(typename in Schemas)) throw new Error(`Schema not found for ${typename}`);

    const Schema = Schemas[typename as keyof typeof Schemas] as unknown as ZodType<T>;

    return {
      count: (query) => {
        return this.db.collection(typename).countDocuments(query);
      },
      find: async (query, options) => {
        const data = await this.db
          .collection(typename)
          .find(query)
          .limit(options?.limit || 100)
          .skip(options?.offset || 0)
          .toArray();

        return data.map((item) => Schema.parse(item));
      },
      save: async (node, replace) => {
        let arrNode = Array.isArray(node) ? node : [node];

        if (typename !== 'Actor') {
          const { data, refs } = extract(arrNode, ActorSchema, (d) => d.id);
          arrNode = data;
          await this.actorStorage.save(refs, replace);
        }

        await this.db
          .collection(typename)
          .bulkWrite(
            arrNode.map((item) =>
              replace
                ? { replaceOne: { filter: { _id: getId(item) }, replacement: item, upsert: true } }
                : { insertOne: { document: { _id: getId(item), ...item } } }
            )
          )
          .catch((err) => {
            if (err.code === 11000) return;
            throw err;
          });
      }
    };
  }
}
