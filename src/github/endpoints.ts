import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import { TimelineEvent } from '../entities/events.js';
import { Issue, PullRequest } from '../entities/issue.js';
import { Release } from '../entities/release.js';
import { Repository } from '../entities/repository.js';
import { Tag } from '../entities/tag.js';
import { User } from '../entities/user.js';
import { Watcher } from '../entities/watcher.js';
import { clients } from './clients.js';
import { ResourcesParams } from './repository/resources/index.js';

export type IterableEndpoints = {
  'GET /repositories/:repo/subscribers': {
    response: GetResponseDataTypeFromEndpointMethod<
      typeof clients.rest.activity.listWatchersForRepo
    >;
    result: Watcher;
    params: ResourcesParams;
  };
  'GET /repositories/:repo/tags': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.listTags>;
    result: Tag;
    params: ResourcesParams;
  };
  'GET /repositories/:repo/releases': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.listReleases>;
    result: Release;
    params: ResourcesParams;
  };
  'GET /repositories/:repo/issues': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.issues.list>;
    result: Issue;
    params: ResourcesParams & {
      state: 'open' | 'closed' | 'all';
      sort: 'created' | 'updated';
      direction: 'asc' | 'desc';
      since?: string;
    };
  };
  'GET /repositories/:repo/issues/:number/timeline': {
    response: GetResponseDataTypeFromEndpointMethod<
      typeof clients.rest.issues.listEventsForTimeline
    >;
    result: TimelineEvent;
    params: ResourcesParams & { number: number };
  };
};

export type ResourceEndpoints = {
  'GET /repositories/:repo/pulls/:number': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.pulls.get>;
    result: PullRequest;
    params: ResourcesParams & { number: number };
  };
  'GET /repos/:owner/:name': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.get>;
    result: Repository;
    params: { owner: string; name: string };
  };
  'GET /repositories/:repo': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.get>;
    result: Repository;
    params: { repo: number };
  };
  'GET /user/:id': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.users.getByUsername>;
    result: User;
    params: { id: number };
  };
  'GET /users/:login': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.users.getByUsername>;
    result: User;
    params: { login: string };
  };
};