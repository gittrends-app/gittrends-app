/* eslint-disable require-jsdoc */
/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging */
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
        users: [expect.objectContaining(user)]
      });
    });

    it('should extract data and users from root objects', () => {
      expect(extract(user)).toEqual({
        data: user.node_id,
        users: [expect.objectContaining(user)]
      });

      expect(extract([user])).toEqual({
        data: [user.node_id],
        users: [expect.objectContaining(user)]
      });
    });

    it('should extract data and users from entities', () => {
      const schema = z.object({ user: z.union([userSchema, z.string()]) });
      interface EntityImpl extends z.infer<typeof schema> {}
      class EntityImpl extends Entity {
        protected static override _schema = schema;
        get _id(): string {
          return 'any';
        }
      }

      expect(extract(new EntityImpl({ user: user }))).toEqual({
        data: expect.objectContaining({ user: user.node_id }),
        users: [expect.objectContaining(user)]
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
        users: [expect.objectContaining(user)]
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
        users: [expect.objectContaining(user)]
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
        users: [expect.objectContaining(user), expect.objectContaining(user)]
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
        users: [expect.objectContaining(user)]
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
        users: [expect.objectContaining(user)]
      });
    });
  });
});
