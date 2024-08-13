import { RestEndpointMethodTypes } from '@octokit/rest';
import {
  Commit,
  Issue,
  PullRequest,
  Reaction,
  Release,
  Repository,
  Tag,
  TimelineEvent,
  User,
  Watcher
} from '../../../entities/Entity.js';
import { PageableParams } from '../../service.js';

export type IterableEndpoints = {
  'GET /repositories/:repo/subscribers': {
    response: RestEndpointMethodTypes['activity']['listWatchersForRepo']['response'];
    result: Watcher;
    params: { repo: number } & PageableParams;
  };
  'GET /repositories/:repo/tags': {
    response: RestEndpointMethodTypes['repos']['listTags']['response'];
    result: Tag;
    params: { repo: number } & PageableParams;
  };
  'GET /repositories/:repo/releases': {
    response: RestEndpointMethodTypes['repos']['listReleases']['response'];
    result: Release;
    params: { repo: number } & PageableParams;
  };
  'GET /repositories/:repo/releases/:release/reactions': {
    response: RestEndpointMethodTypes['reactions']['listForRelease']['response'];
    result: Reaction;
    params: { repo: number; release: number } & PageableParams;
  };
  'GET /repositories/:repo/issues': {
    response: RestEndpointMethodTypes['issues']['list']['response'];
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
    response: RestEndpointMethodTypes['reactions']['listForIssue']['response'];
    result: Reaction;
    params: { repo: number; number: number } & PageableParams;
  };
  'GET /repositories/:repo/issues/comments/:id/reactions': {
    response: RestEndpointMethodTypes['reactions']['listForIssueComment']['response'];
    result: Reaction;
    params: { repo: number; id: number } & PageableParams;
  };
  'GET /repositories/:repo/pulls/comments/:id/reactions': {
    response: RestEndpointMethodTypes['reactions']['listForPullRequestReviewComment']['response'];
    result: Reaction;
    params: { repo: number; id: number } & PageableParams;
  };
  'GET /repositories/:repo/issues/:number/timeline': {
    response: RestEndpointMethodTypes['issues']['listEventsForTimeline']['response'];
    result: TimelineEvent;
    params: { repo: number; number: number } & PageableParams;
  };
  'GET /repositories/:repo/commits': {
    response: RestEndpointMethodTypes['repos']['listCommits']['response'];
    result: Commit;
    params: { repo: number; since?: string } & PageableParams;
  };
};

export type ResourceEndpoints = {
  'GET /repositories/:repo/pulls/:number': {
    response: RestEndpointMethodTypes['pulls']['get']['response'];
    result: PullRequest;
    params: { repo: number; number: number } & PageableParams;
  };
  'GET /repos/:owner/:name': {
    response: RestEndpointMethodTypes['repos']['get']['response'];
    result: Repository;
    params: { owner: string; name: string };
  };
  'GET /repositories/:repo': {
    response: RestEndpointMethodTypes['repos']['get']['response'];
    result: Repository;
    params: { repo: number };
  };
  'GET /user/:id': {
    response: RestEndpointMethodTypes['users']['getByUsername']['response'];
    result: User;
    params: { id: number };
  };
  'GET /users/:login': {
    response: RestEndpointMethodTypes['users']['getByUsername']['response'];
    result: User;
    params: { login: string };
  };
  'GET /repositories/:repo/commits/:sha': {
    response: RestEndpointMethodTypes['repos']['getCommit']['response'];
    result: Commit;
    params: { repo: number; sha: string };
  };
};
