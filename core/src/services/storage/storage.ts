import { Node } from '../../entities/base/Node.js';
import { RepositoryNode } from '../../entities/base/RepositoryNode.js';

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
  nodeStorage<T extends Node>(typename: string): NodeStorage<T>;
  repoNodeStorage<T extends RepositoryNode>(type: string): RepositoryNodeStorage<T>;
}
