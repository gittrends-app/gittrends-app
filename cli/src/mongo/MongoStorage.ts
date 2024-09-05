import { Node } from '@/core/entities/base/Node.js';
import { RepositoryNode, RepositoryNodeSchema } from '@/core/entities/base/RepositoryNode.js';
import { Metadata } from '@/core/entities/Metadata.js';
import {
  Actor,
  ActorSchema,
  CommitSchema,
  Discussion,
  DiscussionComment,
  DiscussionCommentSchema,
  DiscussionSchema,
  NodeStorage,
  Reaction,
  ReactionSchema,
  ReleaseSchema,
  Repository,
  RepositoryNodeStorage,
  RepositorySchema,
  Stargazer,
  StargazerSchema,
  StorageFactory,
  Tag,
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
  Commit: CommitSchema,
  Discussion: DiscussionSchema,
  DiscussionComment: DiscussionCommentSchema,
  Metadata: RepositoryNodeSchema.passthrough(),
  Reaction: ReactionSchema,
  Release: ReleaseSchema,
  Repository: RepositorySchema,
  Stargazer: StargazerSchema,
  Tag: TagSchema,
  Watcher: WatcherSchema
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
  private reactionsStorage: NodeStorage<Reaction>;
  private discussionCommentsStorage: NodeStorage<DiscussionComment>;

  constructor(db: Db) {
    this.db = db;
    this.actorStorage = this.nodeStorage('Actor');
    this.reactionsStorage = this.nodeStorage('Reaction');
    this.discussionCommentsStorage = this.nodeStorage('DiscussionComment');
  }

  nodeStorage(typename: 'Actor'): NodeStorage<Actor>;
  nodeStorage(typename: 'Repository'): NodeStorage<Repository>;
  nodeStorage(typename: 'Metadata'): NodeStorage<Metadata>;
  nodeStorage(typename: 'Reaction'): NodeStorage<Reaction>;
  nodeStorage(typename: 'Discussion'): NodeStorage<Discussion>;
  nodeStorage(typename: 'DiscussionComment'): NodeStorage<DiscussionComment>;
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

        if (typename === 'Discussion') {
          const { data, refs } = extract(arrNode, DiscussionCommentSchema, (d) => d.id);
          arrNode = data;
          await this.discussionCommentsStorage.save(refs, replace);
        }

        if (typename !== 'Actor') {
          const { data, refs } = extract(arrNode, ActorSchema, (d) => d.id);
          arrNode = data;
          await this.actorStorage.save(refs, replace);
        }

        if (typename !== 'Reaction') {
          const { data, refs } = extract(arrNode, ReactionSchema, (d) => d.id);
          arrNode = data;
          await this.reactionsStorage.save(refs, replace);
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

  repoNodeStorage(typename: 'Watcher'): RepositoryNodeStorage<Watcher>;
  repoNodeStorage(typename: 'Stargazer'): RepositoryNodeStorage<Stargazer>;
  repoNodeStorage(typename: 'Tag'): RepositoryNodeStorage<Tag>;
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

        if (typename === 'Discussion') {
          const { data, refs } = extract(arrNode, DiscussionCommentSchema, (d) => d.id);
          arrNode = data;
          await this.discussionCommentsStorage.save(refs, replace);
        }

        if (typename !== 'Actor') {
          const { data, refs } = extract(arrNode, ActorSchema, (d) => d.id);
          arrNode = data;
          await this.actorStorage.save(refs, replace);
        }

        if (typename !== 'Reaction') {
          const { data, refs } = extract(arrNode, ReactionSchema, (d) => d.id);
          arrNode = data;
          await this.reactionsStorage.save(refs, replace);
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
