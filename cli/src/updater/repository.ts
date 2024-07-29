import {
  Issue,
  Release,
  Repository,
  RepositoryResource,
  Stargazer,
  StorageService,
  Tag,
  Watcher
} from '@/core/index.js';
import { QueueObject, queue } from 'async';
import { Class } from 'type-fest';
import { AbstractTask } from './tasks.js';

type Notification<T extends RepositoryResource = RepositoryResource> = { repository: string } & (
  | { resource?: undefined; data: Repository }
  | { resource: Class<T>; data: T[]; finished: false }
  | { resource: Class<T>; finished: true }
);

/**
 * Task to retrieve all resources from a repository.
 */
export class RepositoryUpdater extends AbstractTask<Notification> {
  private idOrName: string | number;

  private service: StorageService;
  private resources: Class<Tag | Release | Stargazer | Watcher | Issue>[];
  private queue: QueueObject<Parameters<StorageService['resource']>>;

  constructor(
    idOrName: string | number,
    params: {
      service: StorageService;
      resources?: Class<Tag | Release | Stargazer | Watcher | Issue>[];
      parallel?: boolean;
    }
  ) {
    super();
    this.idOrName = idOrName;
    this.service = params.service;
    this.resources = params.resources || [Tag, Release, Stargazer, Watcher, Issue];

    this.queue = queue(
      async ([res, opts]: Parameters<StorageService['resource']>) => {
        for await (const response of this.service.resource(res, opts)) {
          this.notify({ repository: opts.repo.node_id, resource: res, data: response.data, finished: false });
        }
        this.notify({ repository: opts.repo.node_id, resource: res, finished: true });
      },
      params.parallel ? params.resources?.length || 5 : 1
    );
  }

  async execute(): Promise<void> {
    if (this.state === 'running') throw new Error('Task already running!');

    try {
      this.state = 'running';

      const [owner, name] = this.idOrName.toString().split('/');

      const repo = await this.service.repository(owner, name);
      if (!repo) throw new Error('Repository not found!');

      this.notify({ repository: repo._id, data: repo });

      await Promise.all(
        this.resources.map((resource) =>
          this.queue.pushAsync([[resource as any, { repo, per_page: resource === Issue ? 25 : 100 }]])
        )
      );
      await this.queue.drain();

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      this.notify(error instanceof Error ? error : new Error(JSON.stringify(error)));
      throw error;
    }
  }
}
