import { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';
import {
  Issue,
  PullRequest,
  Reaction,
  Release,
  Repository,
  Tag,
  TimelineEvent,
  User,
  Watcher
} from '../../entities/entity.js';
import { clients } from '../clients.js';
import { PageableParams } from './index.js';

export type IterableEndpoints = {
  'GET /repositories/:repo/subscribers': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.activity.listWatchersForRepo>;
    result: Watcher;
    params: { repo: number } & PageableParams;
  };
  'GET /repositories/:repo/tags': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.listTags>;
    result: Tag;
    params: { repo: number } & PageableParams;
  };
  'GET /repositories/:repo/releases': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.repos.listReleases>;
    result: Release;
    params: { repo: number } & PageableParams;
  };
  'GET /repositories/:repo/releases/:release/reactions': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.reactions.listForRelease>;
    result: Reaction;
    params: { repo: number; release: number } & PageableParams;
  };
  'GET /repositories/:repo/issues': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.issues.list>;
    result: Issue;
    params: {
      repo: number;
      state: 'open' | 'closed' | 'all';
      sort: 'created' | 'updated';
      direction: 'asc' | 'desc';
      since?: string;
    } & PageableParams;
  };
  'GET /repositories/:repo/issues/:number/reactions': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.reactions.listForIssue>;
    result: Reaction;
    params: { repo: number; number: number } & PageableParams;
  };
  'GET /repositories/:repo/issues/comments/:id/reactions': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.reactions.listForIssueComment>;
    result: Reaction;
    params: { repo: number; id: number } & PageableParams;
  };
  'GET /repositories/:repo/pulls/comments/:id/reactions': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.reactions.listForPullRequestReviewComment>;
    result: Reaction;
    params: { repo: number; id: number } & PageableParams;
  };
  'GET /repositories/:repo/issues/:number/timeline': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.issues.listEventsForTimeline>;
    result: TimelineEvent;
    params: { repo: number; number: number } & PageableParams;
  };
};

export type ResourceEndpoints = {
  'GET /repositories/:repo/pulls/:number': {
    response: GetResponseDataTypeFromEndpointMethod<typeof clients.rest.pulls.get>;
    result: PullRequest;
    params: { repo: number; number: number } & PageableParams;
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
