import { MongoStorage } from '@/mongo/MongoStorage.js';
import { Actor, Repository, RepositoryNode, Service } from '@gittrends-app/core';
import { Geocoder } from '@gittrends-app/geocoder-core';
import camelCase from 'lodash/camelCase.js';
import upperFirst from 'lodash/upperFirst.js';
import PQueue from 'p-queue';
import pluralize from 'pluralize';
import { ArrayValues, ObservableLike, Observer, Unsubscribable } from 'type-fest';

/**
 * Task interface.
 */
export interface Task<T = unknown> extends ObservableLike<T> {
  state: 'pending' | 'running' | 'completed' | 'error';
  execute(): Promise<void>;
}

/**
 * Abstract class for tasks.
 */
export abstract class AbstractTask<T = unknown> implements Task<T> {
  state: 'pending' | 'running' | 'completed' | 'error' = 'pending';

  private observers: (Partial<Observer<T>> | undefined)[] = [];

  subscribe(observer: Partial<Observer<T>>): Unsubscribable {
    const index = this.observers.push(observer) - 1;
    return { unsubscribe: () => (this.observers[index] = undefined) };
  }

  protected notify(data: T | Error): void {
    if (typeof data === 'number') {
      if (data === 1) this.complete();
      this.observers.forEach((observer) => observer?.next?.(data));
    } else if (data instanceof Error) {
      this.observers.forEach((observer) => observer?.error?.(data));
    } else {
      this.observers.forEach((observer) => observer?.next?.(data));
    }
  }

  protected complete(): void {
    this.observers.forEach((observer) => observer?.complete?.());
  }

  [Symbol.observable](): ObservableLike<T> {
    return this;
  }

  abstract execute(): Promise<void>;
}

const UpdatableResources = [
  'tags',
  'releases',
  'stargazers',
  'watchers',
  'issues',
  'pull_requests',
  'commits',
  'users',
  'discussions',
  'locations'
] as const;

type UpdatableResource = ArrayValues<typeof UpdatableResources>;

type Notification = { repository: string } & (
  | { resource?: undefined; data: Repository }
  | { resource: UpdatableResource; data: RepositoryNode[] | Actor[]; total?: number; done: false }
  | { resource: UpdatableResource; done: true }
);

/**
 * Task to retrieve all resources from a repository.
 */
export class RepositoryUpdater extends AbstractTask<Notification> {
  public static readonly resources: UpdatableResource[] = [...UpdatableResources];

  private idOrName: string;

  private service: Service;
  private storage: MongoStorage;
  private geocoder: Geocoder;
  private resources: UpdatableResource[];
  private queue: PQueue;

  constructor(
    idOrName: string,
    params: {
      service: Service;
      storage: MongoStorage;
      geocoder: Geocoder;
      resources?: UpdatableResource[];
      parallel?: boolean;
    }
  ) {
    super();
    this.idOrName = idOrName;
    this.service = params.service;
    this.storage = params.storage;
    this.geocoder = params.geocoder;
    this.resources = params.resources || RepositoryUpdater.resources;
    this.queue = new PQueue({ concurrency: params.parallel ? this.resources.length : 1 });
  }

  async execute(): Promise<void> {
    if (this.state === 'running') throw new Error('Task already running!');

    const repoStorage = this.storage.create('Repository');
    const actorStorage = this.storage.create('Actor');
    const metadataStorage = this.storage.create('Metadata');

    try {
      this.state = 'running';

      const [owner, name] = this.idOrName.toString().split('/');

      const repo = await this.service.repository(owner, name);
      if (!repo) throw new Error('Repository not found!');
      else await repoStorage.save(repo, true);

      this.notify({ repository: repo.id, data: repo });

      const promises = this.resources.map(async (name) =>
        this.queue
          .add(async () => {
            if (name === 'users') {
              let users: Actor[] = [];

              const [notUpdated, all] = await Promise.all([
                actorStorage.count({ updated_at: undefined }),
                actorStorage.count({})
              ]);

              let total = all - notUpdated;

              do {
                users = await actorStorage.find({ updated_at: undefined, _deleted_at: undefined }, { limit: 100 });

                if (users.length > 0) {
                  const updatedUsers = (await this.service.user(users.map((u) => u.id)))
                    .filter((u) => u !== null)
                    .filter((u) => u.updated_at);

                  await actorStorage.save(
                    [
                      ...updatedUsers,
                      // workaround to mark users as deleted when not found with the same id
                      ...users
                        .filter((u) => !updatedUsers.find((uu) => uu.id === u.id))
                        .map((u) => Object.assign(u, { _deleted_at: new Date() }))
                    ],
                    true
                  );

                  this.notify({
                    repository: repo.id,
                    resource: 'users',
                    data: updatedUsers,
                    total: (total += updatedUsers.length),
                    done: false
                  });
                } else if (this.queue.pending > 1) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              } while (users.length > 0 || this.queue.pending > 1);

              this.notify({ repository: repo.id, resource: 'users', done: true });
            } else if (name === 'locations') {
              let users: Actor[] = [];

              const [notUpdated, all] = await Promise.all([
                actorStorage.count({
                  updated_at: { $ne: undefined },
                  location: { $ne: undefined },
                  __location: undefined
                }),
                actorStorage.count({ updated_at: { $ne: undefined }, location: { $ne: undefined } })
              ]);

              let total = all - notUpdated;

              do {
                users = await actorStorage.find(
                  { updated_at: { $ne: undefined }, location: { $ne: undefined }, __location: undefined },
                  { limit: 100 }
                );

                if (users.length > 0) {
                  const updatedUsers = await Promise.all(
                    users.map(async (u) => {
                      const anyUser = u as { location?: string };
                      const query = anyUser.location
                        ?.toLowerCase()
                        .replace(/[\s]+/g, ' ')
                        .replace(/\s*,[\s\\p{L}]*/g, ', ')
                        .trim();

                      if (!query) return null;

                      const location = await this.geocoder.search(query).catch((error) => {
                        if (error.code === 418) return null;
                        throw Object.assign(error, { location: query });
                      });
                      return Object.assign(u, { __location: location || {} });
                    })
                  );

                  await actorStorage.save(
                    updatedUsers.filter((u) => u !== null),
                    true
                  );

                  this.notify({
                    repository: repo.id,
                    resource: 'locations',
                    data: users,
                    total: (total += users.length),
                    done: false
                  });
                } else if (this.queue.pending > 1) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              } while (users.length > 0 || this.queue.pending > 1);

              this.notify({ repository: repo.id, resource: 'locations', done: true });
            } else {
              let perPage = 100;
              if (name === 'issues') perPage = 50;
              if (name === 'pull_requests') perPage = 25;

              const typename = upperFirst(camelCase(pluralize.singular(name)));
              const [meta] = await metadataStorage.find({ id: `${typename}:${repo.id}:` });

              const resourceStorage = this.storage.create<RepositoryNode>(typename);

              let total = await resourceStorage.count({ repository: repo.id });

              const it = this.service.resources(name as any, {
                repository: repo.id,
                per_page: perPage,
                cursor: meta?.cursor,
                since: meta?.since,
                until: meta?.until
              });

              for await (const response of it) {
                if (response.data.length > 0) {
                  await resourceStorage.save(response.data);
                  await metadataStorage.save(
                    {
                      id: `${typename}:${repo.id}:`,
                      __typename: 'Metadata',
                      repository: repo.id,
                      resource: typename,
                      ...response.metadata
                    },
                    true
                  );
                }

                this.notify({
                  repository: repo.id,
                  resource: name,
                  data: response.data,
                  total: (total += response.data.length),
                  done: false
                });
              }

              this.notify({ repository: repo.id, resource: name, done: true });
            }
          })

          .catch((err) => {
            this.notify(err);
            throw err;
          })
      );

      if (this.queue.concurrency > 1) {
        await Promise.allSettled(promises).then((results) => {
          const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
          if (errors.length) throw new AggregateError(errors, errors.map((e) => e.message).join(' -- '));
        });
      } else {
        await Promise.all(promises);
      }

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      this.notify(error instanceof Error ? error : new Error(JSON.stringify(error)));
      throw error;
    }
  }
}
