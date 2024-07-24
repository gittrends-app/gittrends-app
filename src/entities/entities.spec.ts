import { describe, it } from '@jest/globals';
import { entities } from './entities';

import baseUserSchema from './schemas/user';

describe('Entities', () => {
  const baseFields = {
    login: 'freeCodeCamp',
    id: 9892522,
    node_id: 'MDEyOk9yZ2FuaXphdGlvbjk4OTI1MjI=',
    avatar_url: 'https://avatars.githubusercontent.com/u/9892522?v=4',
    url: 'https://api.github.com/users/freeCodeCamp',
    type: 'User',
    site_admin: false
  };

  describe('User', () => {
    it('should add _id, _typename, and _obtained_at to the schema', () => {
      expect(entities.user(baseFields)).toEqual({
        ...baseUserSchema.parse(baseFields),
        _id: baseFields.node_id,
        _typename: 'User',
        _obtained_at: expect.any(Date)
      });
    });

    it('should throw an error if _typename does not match', () => {
      expect(() => entities.user({ ...baseFields, _typename: 'Unknown' })).toThrow();
    });
  });
});
