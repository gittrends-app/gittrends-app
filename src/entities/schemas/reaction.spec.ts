import { describe, expect, it } from '@jest/globals';
import reactionSchema from './reaction.js';

describe('Reaction entity', () => {
  const baseFields = {
    id: 1,
    node_id: 'MDg6UmVhY3Rpb24x',
    content: 'heart',
    created_at: '2016-05-20T20:09:31Z'
  };

  it('should validate required fields', () => {
    expect(() => reactionSchema.parse(baseFields)).not.toThrowError();
    for (const key of Object.keys(baseFields)) {
      expect(() => reactionSchema.parse({ ...baseFields, [key]: undefined })).toThrowError();
    }
  });

  it('should remove unknown fields', () => {
    const result = reactionSchema.parse({ ...baseFields, description: null });
    expect(result).not.toHaveProperty('description');
  });

  it('should validate entries from reactions endpoint', () => {
    expect(
      reactionSchema.parse({
        id: 1,
        node_id: 'MDg6UmVhY3Rpb24x',
        user: {
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
        content: 'heart',
        created_at: '2016-05-20T20:09:31Z'
      })
    ).toEqual({
      id: 1,
      node_id: 'MDg6UmVhY3Rpb24x',
      user: expect.objectContaining({ login: 'octocat' }),
      content: 'heart',
      created_at: new Date('2016-05-20T20:09:31Z')
    });
  });
});
