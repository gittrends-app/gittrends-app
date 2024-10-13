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
  /**
   * Creates a new PassThroughService.
   * @param service The underlying service.
   */
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

  commits(opts: ServiceCommitsParams): Iterable<Commit, { since?: Date; until?: Date }> {
    return this.service.commits(opts);
  }

  discussions(opts: ServiceResourceParams): Iterable<Discussion> {
    return this.service.discussions(opts);
  }

  issues(opts: ServiceResourceParams): Iterable<Issue> {
    return this.service.issues(opts);
  }

  pull_requests(opts: ServiceResourceParams): Iterable<PullRequest> {
    return this.service.pull_requests(opts);
  }

  releases(opts: ServiceResourceParams): Iterable<Release> {
    return this.service.releases(opts);
  }

  stargazers(opts: ServiceResourceParams): Iterable<Stargazer> {
    return this.service.stargazers(opts);
  }

  tags(opts: ServiceResourceParams): Iterable<Tag> {
    return this.service.tags(opts);
  }

  watchers(opts: ServiceResourceParams): Iterable<Watcher> {
    return this.service.watchers(opts);
  }
}
