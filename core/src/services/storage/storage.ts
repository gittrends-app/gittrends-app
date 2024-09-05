import { Actor } from '../../entities/Actor.js';
import { Node } from '../../entities/base/Node.js';
import { RepositoryNode } from '../../entities/base/RepositoryNode.js';
import { Commit } from '../../entities/Commit.js';
import { Discussion } from '../../entities/Discussion.js';
import { DiscussionComment } from '../../entities/DiscussionComment.js';
import { Issue } from '../../entities/Issue.js';
import { Metadata } from '../../entities/Metadata.js';
import { PullRequest } from '../../entities/PullRequest.js';
import { Reaction } from '../../entities/Reaction.js';
import { Release } from '../../entities/Release.js';
import { Repository } from '../../entities/Repository.js';
import { Stargazer } from '../../entities/Stargazer.js';
import { Tag } from '../../entities/Tag.js';
import { TimelineItem } from '../../entities/TimelineItem.js';
import { Watcher } from '../../entities/Watcher.js';

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
 * Factory to create storage instances for each Entity.
 */
export interface StorageFactory {
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
}
