/* eslint-disable jsdoc/require-jsdoc */
import { Entity, Repository, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import { Processor, Queue, Worker } from 'bullmq';
import snakeCase from 'lodash/snakeCase.js';
import pluralize from 'pluralize';
import { Class } from 'type-fest';

type UserJob = { id: number; node_id: string; login: string };
type RepoJob = { id: number; node_id: string; full_name: string; resources: string[] };

/**
 *  Create a new queue for the given entity.
 */
export function createQueue<T extends UserJob, R = any>(Ref: Class<User>): Queue<T, R>;
export function createQueue<T extends RepoJob, R = any>(Ref: Class<Repository>): Queue<T, R>;
export function createQueue<T = any, R = any>(Ref: Class<Entity>): Queue<T, R> {
  return new Queue<T, R>(pluralize(snakeCase(Ref.name)), {
    connection: { host: env.REDIS_HOST, port: env.REDIS_PORT, db: env.REDIS_QUEUE_DB }
  });
}

/**
 *  Create a new worker for the given entity.
 */
export function createWorker<T extends UserJob>(Ref: Class<User>, func: Processor<T>, concurrency?: number): Worker<T>;
export function createWorker<T extends RepoJob>(
  Ref: Class<Repository>,
  func: Processor<T>,
  concurrency?: number
): Worker<T>;
export function createWorker<T>(Ref: Class<Entity>, func: Processor<T>, concurrency?: number): Worker<T> {
  return new Worker(pluralize(snakeCase(Ref.name)), func, {
    concurrency: concurrency || 1,
    connection: { host: env.REDIS_HOST, port: env.REDIS_PORT, db: env.REDIS_QUEUE_DB },
    maxStalledCount: Number.MAX_SAFE_INTEGER
  });
}
