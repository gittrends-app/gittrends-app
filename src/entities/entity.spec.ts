import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { createEntity, createEntityFromUnion } from './entity.js';

describe('Entity', () => {
  describe('createEntity', () => {
    it('should add entity name and obtained date', () => {
      expect(createEntity('User', z.object({ id: z.number() })).parse({ id: 1 })).toEqual({
        id: 1,
        __typename: 'User',
        __obtained_at: expect.any(Date)
      });

      expect(
        createEntityFromUnion(
          'User',
          z.discriminatedUnion('?', [
            z.object({ '?': z.literal('a') }),
            z.object({ '?': z.literal('b') })
          ])
        ).parse({ '?': 'a' })
      ).toEqual({
        '?': 'a',
        __typename: 'User',
        __obtained_at: expect.any(Date)
      });
    });

    it('should throw an error if resource is empty', () => {
      expect(() => createEntity('' as any, z.object({ id: z.number() }))).toThrowError();
      expect(() => createEntity('User', z.object({ id: z.number() }))).not.toThrowError();
    });

    it('should throw an error if schema is empty', () => {
      expect(() => createEntity('User', z.object({}))).toThrowError();
      expect(() => createEntity('User', z.object({ key: z.undefined() }))).not.toThrowError();
    });
  });

  describe('createEntityFromUnion', () => {
    const union = z.discriminatedUnion('?', [
      z.object({ '?': z.literal('a') }),
      z.object({ '?': z.literal('b') })
    ]);

    it('should add entity name and obtained date', () => {
      expect(createEntityFromUnion('User', union).parse({ '?': 'a' })).toEqual({
        '?': 'a',
        __typename: 'User',
        __obtained_at: expect.any(Date)
      });
    });

    it('should throw an error if resource is empty', () => {
      expect(() => createEntityFromUnion('' as any, union)).toThrowError();
      expect(() => createEntityFromUnion('User', union)).not.toThrowError();
    });
  });
});
