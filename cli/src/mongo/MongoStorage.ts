import { Node } from '@/core/entities/base/Node.js';
import { RepositoryNode } from '@/core/entities/base/RepositoryNode.js';
import {
  Actor,
  ActorSchema,
  Commit,
  CommitSchema,
  Discussion,
  DiscussionComment,
  DiscussionCommentSchema,
  DiscussionSchema,
  Issue,
  IssueSchema,
  PullRequest,
  PullRequestSchema,
  Reaction,
  ReactionSchema,
  Release,
  ReleaseSchema,
  Repository,
  RepositorySchema,
  Stargazer,
  StargazerSchema,
  Tag,
  TagSchema,
  TimelineItem,
  TimelineItemSchema,
  Watcher,
  WatcherSchema
} from '@/core/index.js';
import { Metadata, MetadataSchema } from '@/entities/Metadata.js';
import { extract } from '@/helpers/extract.js';
import { Db, ObjectId } from 'mongodb';
import objectHash from 'object-hash';
import { ZodType } from 'zod';

const Schemas = {
  Actor: ActorSchema,
  Commit: CommitSchema,
  Discussion: DiscussionSchema,
  DiscussionComment: DiscussionCommentSchema,
  Issue: IssueSchema,
  TimelineItem: TimelineItemSchema,
  Metadata: MetadataSchema,
  PullRequest: PullRequestSchema,
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
 * Storage interface for a single entity.
 */
export interface Storage<T extends Record<string, any>> {
  get?: (query: Partial<T>) => Promise<T | null>;
  find: (query: Partial<T>, opts?: { limit: number; offset?: number }) => Promise<T[]>;
  save: (data: T | T[], replace?: boolean) => Promise<void>;
  count: (query: Partial<T>) => Promise<number>;
}

/**
 * Storage interface for a single entity.
 */
export interface NodeStorage<T extends Node> extends Storage<T> {
  get: (query: Partial<T>) => Promise<T | null>;
}

/**
 * MongoDB storage factory.
 */
export class MongoStorage {
  private db: Db;

  private actorStorage: NodeStorage<Actor>;
  private reactionsStorage: NodeStorage<Reaction>;
  private discussionCommentsStorage: NodeStorage<DiscussionComment>;
  private timelineItemsStorage: NodeStorage<TimelineItem>;

  constructor(db: Db) {
    this.db = db;
    this.actorStorage = this.create('Actor');
    this.reactionsStorage = this.create('Reaction');
    this.discussionCommentsStorage = this.create('DiscussionComment');
    this.timelineItemsStorage = this.create('TimelineItem');
  }

  create(typename: 'Actor'): NodeStorage<Actor>;
  create(typename: 'Commit'): NodeStorage<Commit>;
  create(typename: 'Discussion'): NodeStorage<Discussion>;
  create(typename: 'DiscussionComment'): NodeStorage<DiscussionComment>;
  create(typename: 'Issue'): NodeStorage<Issue>;
  create(typename: 'Metadata'): NodeStorage<Metadata>;
  create(typename: 'PullRequest'): NodeStorage<PullRequest>;
  create(typename: 'Reaction'): NodeStorage<Reaction>;
  create(typename: 'Release'): NodeStorage<Release>;
  create(typename: 'Repository'): NodeStorage<Repository>;
  create(typename: 'Stargazer'): Storage<Stargazer>;
  create(typename: 'Tag'): Storage<Tag>;
  create(typename: 'TimelineItem'): NodeStorage<TimelineItem>;
  create(typename: 'Watcher'): Storage<Watcher>;
  create<T extends Node>(typename: string): NodeStorage<T>;
  create<T extends RepositoryNode>(typename: string): Storage<T>;
  create<T = any>(typename: string): Storage<any> {
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

        switch (typename) {
          case 'Discussion': {
            await this.discussionCommentsStorage.save(
              (arrNode as Discussion[])
                .map((d) => d.comments || [])
                .flat()
                .filter((c) => typeof c !== 'string'),
              replace
            );

            arrNode = (arrNode as Discussion[]).map((d) => {
              d.comments = d.comments?.map((c) => (typeof c === 'string' ? c : c.id));
              return d;
            });

            break;
          }
          case 'DiscussionComment': {
            await this.discussionCommentsStorage.save(
              (arrNode as DiscussionComment[])
                .map((d) => d.replies || [])
                .flat()
                .filter((c) => typeof c !== 'string'),
              replace
            );

            arrNode = (arrNode as DiscussionComment[]).map((d) => {
              d.replies = d.replies?.map((c) => (typeof c === 'string' ? c : c.id));
              return d;
            });

            break;
          }
          case 'Issue':
          case 'PullRequest': {
            await this.timelineItemsStorage.save(
              (arrNode as (Issue | PullRequest)[])
                .map((d) => d.timeline_items || [])
                .flat()
                .filter((c) => typeof c !== 'string'),
              replace
            );

            arrNode = (arrNode as (Issue | PullRequest)[]).map((d) => {
              d.timeline_items = d.timeline_items?.map((c) => (typeof c === 'string' ? c : c.id));
              return d;
            });

            break;
          }
        }

        if (typename !== 'Reaction') {
          const { data, refs } = extract(arrNode, ReactionSchema, (d) => d.id);
          arrNode = data;
          await this.reactionsStorage.save(refs, replace);
        }

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
            ),
            { ordered: false }
          )
          .catch((err) => {
            if (err.code === 11000) return;
            throw err;
          });
      }
    };
  }
}
