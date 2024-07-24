import { describe, it } from '@jest/globals';
import { schemas } from './entity';

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
    it('should add __id, __typename, and __obtained_at to the schema', () => {
      expect(schemas.user(baseFields)).toEqual({
        ...baseUserSchema.parse(baseFields),
        __id: baseFields.node_id,
        __typename: 'User',
        __obtained_at: expect.any(Date)
      });
    });

    it('should throw an error if __typename does not match', () => {
      expect(() => schemas.user({ ...baseFields, __typename: 'Unknown' })).toThrow();
    });
  });
});
