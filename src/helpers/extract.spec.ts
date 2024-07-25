import { describe, expect, it } from '@jest/globals';

import { z } from 'zod';
import { Entity } from '../entities/Entity.js';
import userSchema from '../entities/schemas/user.js';
import { extract } from './extract.js';

describe('extract', () => {
  describe('users', () => {
    const user = {
      login: 'danielbruns',
      id: 1478925,
      node_id: 'MDQ6VXNlcjE0Nzg5MjU=',
      avatar_url: 'https://avatars.githubusercontent.com/u/1478925?v=4',
      url: 'https://api.github.com/users/danielbruns',
      type: 'User',
      site_admin: false
    };

    it('should extract data and users from objects', () => {
      expect(
        extract({
          starred_at: '2014-06-10T17:13:03Z',
          user: user
        })
      ).toEqual({
        data: { starred_at: '2014-06-10T17:13:03Z', user: user.node_id },
        users: [expect.objectContaining({ data: user })]
      });
    });

    it('should extract data and users from entities', () => {
      const schema = z.object({ user: userSchema });
      // eslint-disable-next-line require-jsdoc
      class EntityImpl extends Entity<typeof schema> {
        static schema = schema;
        get id(): string {
          return this.data.user.node_id;
        }
      }

      const entity = new EntityImpl({ user: user });
      expect(extract(entity)).toEqual({
        data: expect.objectContaining({ data: { user: user.node_id } }),
        users: [expect.objectContaining({ data: user })]
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
        users: [expect.objectContaining({ data: user })]
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
        users: [expect.objectContaining({ data: user })]
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
        users: [expect.objectContaining({ data: user }), expect.objectContaining({ data: user })]
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
        users: [expect.objectContaining({ data: user })]
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
        users: [expect.objectContaining({ data: user })]
      });
    });
  });
});
