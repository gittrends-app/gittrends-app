import { describe } from '@jest/globals';
import { schemas } from '../entities/entity';
import isEntity from './is-entity';

describe('is-entity', () => {
  describe('user', () => {
    const user = schemas.user({
      login: 'danielbruns',
      id: 1478925,
      node_id: 'MDQ6VXNlcjE0Nzg5MjU=',
      avatar_url: 'https://avatars.githubusercontent.com/u/1478925?v=4',
      url: 'https://api.github.com/users/danielbruns',
      type: 'User',
      site_admin: false
    });

    it('should validate user', () => {
      expect(isEntity.user(user)).toBeTruthy();
      expect(isEntity.user(user)).toHaveProperty('__typename', 'User');
    });

    it('should not validate invalid user', () => {
      expect(isEntity.user({ ...user, login: undefined })).toBe(false);
      expect(isEntity.user({ ...user, id: undefined })).toBe(false);
    });
  });
});
