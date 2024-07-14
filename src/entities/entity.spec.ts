import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { createEntity } from './entity.js';

describe('Entity', () => {
  it('should add entity name and obtained date', () => {
    expect(createEntity('Test', z.object({ id: z.number() })).parse({ id: 1 })).toEqual({
      id: 1,
      __typename: 'Test',
      __obtained_at: expect.any(Date)
    });
  });
});
