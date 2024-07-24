import { describe, expect, it } from '@jest/globals';

import { schemas, User } from '../entities/entity.js';
import { extract } from './extract.js';

describe('extract', () => {
  describe('users', () => {
    const user = schemas.user({
      login: 'danielbruns',
      id: 1478925,
      node_id: 'MDQ6VXNlcjE0Nzg5MjU=',
      avatar_url: 'https://avatars.githubusercontent.com/u/1478925?v=4',
      url: 'https://api.github.com/users/danielbruns',
      type: 'User',
      site_admin: false
    });

    it('should extract data and users from objects', () => {
      expect(
        extract({
          starred_at: '2014-06-10T17:13:03Z',
          user: user
        })
      ).toEqual({
        data: { starred_at: '2014-06-10T17:13:03Z', user: user.node_id },
        users: [user]
      });
    });

    it('should extract data and users from deep objects', () => {
      expect(
        extract({
          starred_at: '2014-06-10T17:13:03Z',
          key: { user: user }
        })
      ).toEqual({
        data: { starred_at: '2014-06-10T17:13:03Z', key: { user: user.node_id } },
        users: [user]
      });
    });

    it('should extract data and users from arrays', () => {
      expect(
        extract({
          starred_at: '2014-06-10T17:13:03Z',
          key: [user]
        })
      ).toEqual({
        data: { starred_at: '2014-06-10T17:13:03Z', key: [user.node_id] },
        users: [user]
      });
    });

    it('should extract data and users from arrays with multiple instances', () => {
      expect(
        extract({
          starred_at: '2014-06-10T17:13:03Z',
          key: [user, user, 2]
        })
      ).toEqual({
        data: { starred_at: '2014-06-10T17:13:03Z', key: [user.node_id, user.node_id, 2] },
        users: [user, user]
      });
    });

    it('should extract data and users from objects inside arrays', () => {
      expect(
        extract({
          starred_at: '2014-06-10T17:13:03Z',
          key: [{ user: user }]
        })
      ).toEqual({
        data: { starred_at: '2014-06-10T17:13:03Z', key: [{ user: user.node_id }] },
        users: [user]
      });
    });

    it('should extract data and users from arrays', () => {
      expect(
        extract([
          {
            starred_at: '2014-06-10T17:13:03Z',
            user: user
          }
        ])
      ).toEqual({
        data: [{ starred_at: '2014-06-10T17:13:03Z', user: user.node_id }],
        users: [user]
      });
    });
  });

  describe('reactions', () => {
    const reaction = schemas.reaction({
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
      created_at: '2016-05-20T20:09:31Z',
      _repository: '123456789',
      _reactable_name: 'Release',
      _reactable_id: 'abcdef123456'
    });

    it('should extract data and reactions from objects', () => {
      expect(
        extract({
          reactions: [reaction]
        })
      ).toEqual({
        data: { reactions: [reaction.node_id] },
        users: [expect.objectContaining({ login: 'octocat' })],
        reactions: [{ ...reaction, user: (reaction.user as User).node_id }]
      });
    });
  });
});
