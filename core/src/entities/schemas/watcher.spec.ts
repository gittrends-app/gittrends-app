import { describe, expect, it } from '@jest/globals';
import watcherSchema from './watcher.js';

describe('User entity', () => {
  const baseFields = {
    login: 'freeCodeCamp',
    id: 9892522,
    node_id: 'MDEyOk9yZ2FuaXphdGlvbjk4OTI1MjI=',
    type: 'User',
    site_admin: false
  };

  it('should validate data from listing', () => {
    expect(() => watcherSchema.parse(baseFields)).not.toThrowError();
    expect(watcherSchema.parse(baseFields)).toEqual({ user: baseFields });
  });
});
