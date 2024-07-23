import { describe, expect, it } from '@jest/globals';

import { schemas } from '../entities/entity.js';
import { extract } from './extract.js';

describe('extract', () => {
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
      data: { starred_at: '2014-06-10T17:13:03Z', user: user.id },
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
      data: { starred_at: '2014-06-10T17:13:03Z', key: { user: user.id } },
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
      data: { starred_at: '2014-06-10T17:13:03Z', key: [user.id] },
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
      data: { starred_at: '2014-06-10T17:13:03Z', key: [user.id, user.id, 2] },
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
      data: { starred_at: '2014-06-10T17:13:03Z', key: [{ user: user.id }] },
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
      data: [{ starred_at: '2014-06-10T17:13:03Z', user: user.id }],
      users: [user]
    });
  });
});
