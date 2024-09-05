import { Actor } from '../../entities/Actor.js';
import { Node } from '../../entities/base/Node.js';
import { RepositoryNode } from '../../entities/base/RepositoryNode.js';
import { Commit } from '../../entities/Commit.js';
import { Discussion } from '../../entities/Discussion.js';
import { DiscussionComment } from '../../entities/DiscussionComment.js';
import { Issue } from '../../entities/Issue.js';
import { Metadata } from '../../entities/Metadata.js';
import { Reaction } from '../../entities/Reaction.js';
import { Repository } from '../../entities/Repository.js';
import { TimelineItem } from '../../entities/TimelineItem.js';

/**
 * Storage interface for a single entity.
 */
export interface NodeStorage<T extends Node> {
  get: (query: Partial<T>) => Promise<T | null>;
  find: (query: Partial<T>, opts?: { limit: number; offset?: number }) => Promise<T[]>;
  save: (data: T | T[], replace?: boolean) => Promise<void>;
  count: (query: Partial<T>) => Promise<number>;
}

/**
 * Storage interface for a single entity.
 */
export interface RepositoryNodeStorage<T extends RepositoryNode> {
  find: (query: Partial<T>, opts?: { limit: number; offset?: number }) => Promise<T[]>;
  save: (data: T | T[], replace?: boolean) => Promise<void>;
  count: (query: Partial<T>) => Promise<number>;
}

/**
 * Factory to create storage instances for each Entity.
 */
export interface StorageFactory {
  nodeStorage(typename: 'Repository'): NodeStorage<Repository>;
  nodeStorage(typename: 'Actor'): NodeStorage<Actor>;
  nodeStorage(typename: 'Metadata'): NodeStorage<Metadata>;
  nodeStorage(typename: 'Reaction'): NodeStorage<Reaction>;
  nodeStorage(typename: 'Discussion'): NodeStorage<Discussion>;
  nodeStorage(typename: 'DiscussionComment'): NodeStorage<DiscussionComment>;
  nodeStorage(typename: 'Commit'): NodeStorage<Commit>;
  nodeStorage(typename: 'Issue'): NodeStorage<Issue>;
  nodeStorage(typename: 'TimelineItem'): NodeStorage<TimelineItem>;
  nodeStorage<T extends Node>(typename: string): NodeStorage<T>;

  repoNodeStorage<T extends RepositoryNode>(type: string): RepositoryNodeStorage<T>;
}
