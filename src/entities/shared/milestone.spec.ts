import { describe, expect, it } from '@jest/globals';
import { milestoneSchema } from './milestone.js';

describe('Milestone entity', () => {
  const example = {
    url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1',
    id: 1002604,
    node_id: 'MDk6TWlsZXN0b25lMTAwMjYwNA==',
    number: 1,
    state: 'open',
    title: 'v1.0',
    open_issues: 4,
    closed_issues: 8,
    created_at: '2011-04-10T20:09:31Z',
    updated_at: '2014-03-03T18:58:10Z'
  };

  it('should validate required fields', () => {
    expect(() => milestoneSchema.parse(example)).not.toThrowError();
    for (const key of Object.keys(example)) {
      expect(() => milestoneSchema.parse({ ...example, [key]: undefined })).toThrowError();
    }
  });

  it('should remove null fields', () => {
    const result = milestoneSchema.parse({ ...example, description: null });
    expect(result).not.toHaveProperty('description');
  });

  it('should parse milestone details from docs', () => {
    expect(
      milestoneSchema.parse({
        url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1',
        html_url: 'https://github.com/octocat/Hello-World/milestones/v1.0',
        labels_url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1/labels',
        id: 1002604,
        node_id: 'MDk6TWlsZXN0b25lMTAwMjYwNA==',
        number: 1,
        state: 'open',
        title: 'v1.0',
        description: 'Tracking milestone for version 1.0',
        creator: {
          login: 'octocat',
          id: 1,
          node_id: 'MDQ6VXNlcjE=',
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          gravatar_id: '',
          url: 'https://api.github.com/users/octocat',
          html_url: 'https://github.com/octocat',
          followers_url: 'https://api.github.com/users/octocat/followers',
          following_url: 'https://api.github.com/users/octocat/following{/other_user}',
          gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
          organizations_url: 'https://api.github.com/users/octocat/orgs',
          repos_url: 'https://api.github.com/users/octocat/repos',
          events_url: 'https://api.github.com/users/octocat/events{/privacy}',
          received_events_url: 'https://api.github.com/users/octocat/received_events',
          type: 'User',
          site_admin: false
        },
        open_issues: 4,
        closed_issues: 8,
        created_at: '2011-04-10T20:09:31Z',
        updated_at: '2014-03-03T18:58:10Z',
        closed_at: '2013-02-12T13:22:01Z',
        due_on: '2012-10-09T23:39:01Z'
      })
    ).toEqual({
      url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1',
      id: 1002604,
      node_id: 'MDk6TWlsZXN0b25lMTAwMjYwNA==',
      number: 1,
      state: 'open',
      title: 'v1.0',
      description: 'Tracking milestone for version 1.0',
      creator: expect.objectContaining({ id: 1 }),
      open_issues: 4,
      closed_issues: 8,
      created_at: new Date('2011-04-10T20:09:31Z'),
      updated_at: new Date('2014-03-03T18:58:10Z'),
      closed_at: new Date('2013-02-12T13:22:01Z'),
      due_on: new Date('2012-10-09T23:39:01Z')
    });
  });

  it('it should parse milestone info from issue details', () => {
    expect(
      milestoneSchema.parse({
        url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1',
        html_url: 'https://github.com/octocat/Hello-World/milestones/v1.0',
        labels_url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1/labels',
        id: 1002604,
        node_id: 'MDk6TWlsZXN0b25lMTAwMjYwNA==',
        number: 1,
        state: 'open',
        title: 'v1.0',
        description: 'Tracking milestone for version 1.0',
        creator: {
          login: 'octocat',
          id: 1,
          node_id: 'MDQ6VXNlcjE=',
          avatar_url: 'https://github.com/images/error/octocat_happy.gif',
          gravatar_id: '',
          url: 'https://api.github.com/users/octocat',
          html_url: 'https://github.com/octocat',
          followers_url: 'https://api.github.com/users/octocat/followers',
          following_url: 'https://api.github.com/users/octocat/following{/other_user}',
          gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
          organizations_url: 'https://api.github.com/users/octocat/orgs',
          repos_url: 'https://api.github.com/users/octocat/repos',
          events_url: 'https://api.github.com/users/octocat/events{/privacy}',
          received_events_url: 'https://api.github.com/users/octocat/received_events',
          type: 'User',
          site_admin: false
        },
        open_issues: 4,
        closed_issues: 8,
        created_at: '2011-04-10T20:09:31Z',
        updated_at: '2014-03-03T18:58:10Z',
        closed_at: '2013-02-12T13:22:01Z',
        due_on: '2012-10-09T23:39:01Z'
      })
    ).toEqual({
      url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1',
      id: 1002604,
      node_id: 'MDk6TWlsZXN0b25lMTAwMjYwNA==',
      number: 1,
      state: 'open',
      title: 'v1.0',
      description: 'Tracking milestone for version 1.0',
      creator: expect.objectContaining({ id: 1 }),
      open_issues: 4,
      closed_issues: 8,
      created_at: new Date('2011-04-10T20:09:31Z'),
      updated_at: new Date('2014-03-03T18:58:10Z'),
      closed_at: new Date('2013-02-12T13:22:01Z'),
      due_on: new Date('2012-10-09T23:39:01Z')
    });
  });
});
