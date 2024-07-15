import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { createEntity, createEntityFromUnion } from './entity.js';

describe('Entity', () => {
  describe('createEntity', () => {
    it('should add entity name and obtained date', () => {
      expect(createEntity('Test', z.object({ id: z.number() })).parse({ id: 1 })).toEqual({
        id: 1,
        __typename: 'Test',
        __obtained_at: expect.any(Date)
      });

      expect(
        createEntityFromUnion(
          'Test',
          z.discriminatedUnion('?', [
            z.object({ '?': z.literal('a') }),
            z.object({ '?': z.literal('b') })
          ])
        ).parse({ '?': 'a' })
      ).toEqual({
        '?': 'a',
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

  describe('createEntityFromUnion', () => {
    const union = z.discriminatedUnion('?', [
      z.object({ '?': z.literal('a') }),
      z.object({ '?': z.literal('b') })
    ]);

    it('should add entity name and obtained date', () => {
      expect(createEntityFromUnion('Test', union).parse({ '?': 'a' })).toEqual({
        '?': 'a',
        __typename: 'Test',
        __obtained_at: expect.any(Date)
      });
    });

    it('should throw an error if resource is empty', () => {
      expect(() => createEntityFromUnion('', union)).toThrowError();
      expect(() => createEntityFromUnion('NotEmtpty', union)).not.toThrowError();
    });
  });
});
