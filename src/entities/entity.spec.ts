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

  it('should throw an error if resource is empty', () => {
    expect(() => createEntity('', z.object({ id: z.number() }))).toThrowError();
    expect(() => createEntity('NotEmtpty', z.object({ id: z.number() }))).not.toThrowError();
  });

  it('should throw an error if schema is empty', () => {
    expect(() => createEntity('Empty', z.object({}))).toThrowError();
    expect(() => createEntity('Empty', z.object({ key: z.undefined() }))).not.toThrowError();
  });
});
