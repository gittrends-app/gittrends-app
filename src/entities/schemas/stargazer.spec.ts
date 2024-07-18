import { describe, expect, it } from '@jest/globals';
import stargazerSchema from './stargazer.js';

describe('Stargazer entity', () => {
  const sample = {
    starred_at: '2014-06-10T17:13:03Z',
    user: {
      login: 'danielbruns',
      id: 1478925,
      node_id: 'MDQ6VXNlcjE0Nzg5MjU=',
      avatar_url: 'https://avatars.githubusercontent.com/u/1478925?v=4',
      url: 'https://api.github.com/users/danielbruns',
      html_url: 'https://github.com/danielbruns',
      followers_url: 'https://api.github.com/users/danielbruns/followers',
      following_url: 'https://api.github.com/users/danielbruns/following{/other_user}',
      gists_url: 'https://api.github.com/users/danielbruns/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/danielbruns/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/danielbruns/subscriptions',
      organizations_url: 'https://api.github.com/users/danielbruns/orgs',
      repos_url: 'https://api.github.com/users/danielbruns/repos',
      events_url: 'https://api.github.com/users/danielbruns/events{/privacy}',
      received_events_url: 'https://api.github.com/users/danielbruns/received_events',
      type: 'User',
      site_admin: false
    }
  };

  it('should validate required fields', () => {
    expect(() => stargazerSchema.parse(sample)).not.toThrowError();
    for (const key of Object.keys(sample)) {
      expect(() => stargazerSchema.parse({ ...sample, [key]: undefined })).toThrowError();
    }
  });

  it('should allow user to be a id', () => {
    expect(() => stargazerSchema.parse({ ...sample, user: 1 })).not.toThrowError();
  });
});
