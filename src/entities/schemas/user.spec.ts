import { describe, expect, it } from '@jest/globals';
import userSchema from './user';

describe('User entity', () => {
  const baseFields = {
    login: 'freeCodeCamp',
    id: 9892522,
    node_id: 'MDEyOk9yZ2FuaXphdGlvbjk4OTI1MjI=',
    avatar_url: 'https://avatars.githubusercontent.com/u/9892522?v=4',
    url: 'https://api.github.com/users/freeCodeCamp',
    type: 'User',
    site_admin: false
  };

  it('should validate required fields', () => {
    expect(() => userSchema.parse(baseFields)).not.toThrowError();
    for (const key of Object.keys(baseFields)) {
      expect(() => userSchema.parse({ ...baseFields, [key]: undefined })).toThrowError();
    }
  });

  it('should remove null fields', () => {
    const result = userSchema.parse({ ...baseFields, bio: null });
    expect(result).not.toHaveProperty('bio');
  });

  it('should parse organizations from search', () => {
    const owner = {
      login: 'freeCodeCamp',
      id: 9892522,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjk4OTI1MjI=',
      avatar_url: 'https://avatars.githubusercontent.com/u/9892522?v=4',
      url: 'https://api.github.com/users/freeCodeCamp',
      html_url: 'https://github.com/freeCodeCamp',
      followers_url: 'https://api.github.com/users/freeCodeCamp/followers',
      following_url: 'https://api.github.com/users/freeCodeCamp/following{/other_user}',
      gists_url: 'https://api.github.com/users/freeCodeCamp/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/freeCodeCamp/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/freeCodeCamp/subscriptions',
      organizations_url: 'https://api.github.com/users/freeCodeCamp/orgs',
      repos_url: 'https://api.github.com/users/freeCodeCamp/repos',
      events_url: 'https://api.github.com/users/freeCodeCamp/events{/privacy}',
      received_events_url: 'https://api.github.com/users/freeCodeCamp/received_events',
      type: 'Organization',
      site_admin: false
    };

    expect(() => userSchema.parse(owner)).not.toThrowError();
  });

  it('should parse users from search', () => {
    const owner = {
      login: 'sindresorhus',
      id: 170270,
      node_id: 'MDQ6VXNlcjE3MDI3MA==',
      avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4',
      url: 'https://api.github.com/users/sindresorhus',
      html_url: 'https://github.com/sindresorhus',
      followers_url: 'https://api.github.com/users/sindresorhus/followers',
      following_url: 'https://api.github.com/users/sindresorhus/following{/other_user}',
      gists_url: 'https://api.github.com/users/sindresorhus/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/sindresorhus/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/sindresorhus/subscriptions',
      organizations_url: 'https://api.github.com/users/sindresorhus/orgs',
      repos_url: 'https://api.github.com/users/sindresorhus/repos',
      events_url: 'https://api.github.com/users/sindresorhus/events{/privacy}',
      received_events_url: 'https://api.github.com/users/sindresorhus/received_events',
      type: 'User',
      site_admin: false
    };

    expect(userSchema.parse(owner)).toEqual({
      login: 'sindresorhus',
      id: 170270,
      node_id: 'MDQ6VXNlcjE3MDI3MA==',
      avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4',
      url: 'https://api.github.com/users/sindresorhus',
      type: 'User',
      site_admin: false
    });
  });

  it('should validate detailed organization', () => {
    const user = {
      login: 'twbs',
      id: 2918581,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjI5MTg1ODE=',
      avatar_url: 'https://avatars.githubusercontent.com/u/2918581?v=4',
      url: 'https://api.github.com/users/twbs',
      html_url: 'https://github.com/twbs',
      followers_url: 'https://api.github.com/users/twbs/followers',
      following_url: 'https://api.github.com/users/twbs/following{/other_user}',
      gists_url: 'https://api.github.com/users/twbs/gists{/gist_id}',
      starred_url: 'https://api.github.com/users/twbs/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/twbs/subscriptions',
      organizations_url: 'https://api.github.com/users/twbs/orgs',
      repos_url: 'https://api.github.com/users/twbs/repos',
      events_url: 'https://api.github.com/users/twbs/events{/privacy}',
      received_events_url: 'https://api.github.com/users/twbs/received_events',
      type: 'Organization',
      site_admin: false,
      name: 'Bootstrap',
      company: null,
      blog: 'https://getbootstrap.com',
      location: 'San Francisco',
      email: null,
      hireable: null,
      bio: 'Source code and more for the most popular front-end framework in the world.',
      twitter_username: 'getbootstrap',
      public_repos: 26,
      public_gists: 0,
      followers: 10892,
      following: 0,
      created_at: '2012-11-29T05:47:03Z',
      updated_at: '2022-11-27T13:00:41Z'
    };

    expect(userSchema.parse(user)).toEqual({
      login: 'twbs',
      id: 2918581,
      node_id: 'MDEyOk9yZ2FuaXphdGlvbjI5MTg1ODE=',
      avatar_url: 'https://avatars.githubusercontent.com/u/2918581?v=4',
      url: 'https://api.github.com/users/twbs',
      type: 'Organization',
      site_admin: false,
      name: 'Bootstrap',
      blog: 'https://getbootstrap.com',
      location: 'San Francisco',
      bio: 'Source code and more for the most popular front-end framework in the world.',
      twitter_username: 'getbootstrap',
      public_repos: 26,
      public_gists: 0,
      followers: 10892,
      following: 0,
      created_at: new Date('2012-11-29T05:47:03Z'),
      updated_at: new Date('2022-11-27T13:00:41Z')
    });
  });
});
