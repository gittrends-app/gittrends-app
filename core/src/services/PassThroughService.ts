import { Actor } from '../entities/Actor.js';
import { Commit } from '../entities/Commit.js';
import { Discussion } from '../entities/Discussion.js';
import { Issue } from '../entities/Issue.js';
import { PullRequest } from '../entities/PullRequest.js';
import { Release } from '../entities/Release.js';
import { Repository } from '../entities/Repository.js';
import { Stargazer } from '../entities/Stargazer.js';
import { Tag } from '../entities/Tag.js';
import { Watcher } from '../entities/Watcher.js';
import { Iterable, PageableParams, Service, ServiceCommitsParams, ServiceResourceParams } from './Service.js';

/**
 * A service that passes all requests through to the underlying service.
 */
export class PassThroughService implements Service {
  constructor(public readonly service: Service) {}

  search(total: number, opts?: PageableParams): Iterable<Repository> {
    return this.service.search(total, opts);
  }

  user(id: string, opts?: { byLogin: boolean }): Promise<Actor | null>;
  user(id: string[], opts?: { byLogin: boolean }): Promise<(Actor | null)[]>;
  user(id: any, opts?: any): Promise<any> {
    return this.service.user(id, opts);
  }

  repository(ownerOrId: string, name?: string): Promise<Repository | null> {
    return this.service.repository(ownerOrId, name);
  }

  resource(name: 'commits', opts: ServiceCommitsParams): Iterable<Commit, { since?: Date; until?: Date }>;
  resource(name: 'discussions', opts: ServiceResourceParams): Iterable<Discussion>;
  resource(name: 'issues', opts: ServiceResourceParams): Iterable<Issue>;
  resource(name: 'pull_requests', opts: ServiceResourceParams): Iterable<PullRequest>;
  resource(name: 'releases', opts: ServiceResourceParams): Iterable<Release>;
  resource(name: 'stargazers', opts: ServiceResourceParams): Iterable<Stargazer>;
  resource(name: 'tags', opts: ServiceResourceParams): Iterable<Tag>;
  resource(name: 'watchers', opts: ServiceResourceParams): Iterable<Watcher>;
  resource(name: any, opts: any): Iterable<any> {
    return this.service.resource(name, opts);
  }
}
