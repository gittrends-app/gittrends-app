/* eslint-disable jsdoc/require-jsdoc */
import env from '@/helpers/env.js';
import { Processor, Queue, Worker } from 'bullmq';

type UserJob = { id: number; login: string };
type RepoJob = { id: number; name_with_owner: string; resources: string[] };

/**
 *  Create a new queue for the given entity.
 */
export function createQueue<T extends UserJob, R = any>(name: 'users'): Queue<T, R>;
export function createQueue<T extends RepoJob, R = any>(name: 'repos'): Queue<T, R>;
export function createQueue<T = any, R = any>(name: string): Queue<T, R> {
  return new Queue<T, R>(name, {
    connection: { host: env.REDIS_HOST, port: env.REDIS_PORT, db: env.REDIS_QUEUE_DB }
  });
}

/**
 *  Create a new worker for the given entity.
 */
export function createWorker<T extends UserJob>(name: 'users', func: Processor<T>, concurrency?: number): Worker<T>;
export function createWorker<T extends RepoJob>(name: 'repos', func: Processor<T>, concurrency?: number): Worker<T>;
export function createWorker<T>(name: string, func: Processor<T>, concurrency?: number): Worker<T> {
  return new Worker(name, func, {
    concurrency: concurrency || 1,
    connection: { host: env.REDIS_HOST, port: env.REDIS_PORT, db: env.REDIS_QUEUE_DB },
    maxStalledCount: Number.MAX_SAFE_INTEGER
  });
}
