/* eslint-disable require-jsdoc */
import { describe, expect, it } from '@jest/globals';
import { z, ZodError } from 'zod';
import { Entity, Reactable, Reaction } from './Entity';
import reactable from './schemas/reactable';

describe('Entities', () => {
  describe('Entity', () => {
    const schema = z.object({ id: z.string() });

    class EntityImpl extends Entity<typeof schema> {
      protected static schema = schema;

      constructor(data: Record<string, any>) {
        super(data);
      }

      get id() {
        return this.data.id;
      }
    }

    it('should throw an error if invalid data is provided', () => {
      expect(() => new EntityImpl({})).toThrowError(ZodError);
      expect(() => EntityImpl.from({})).toThrowError(ZodError);
    });

    it('should allow data validation', () => {
      expect(EntityImpl.validate({ id: '1' })).toBe(true);
      expect(EntityImpl.validate({ id: 1 })).toBe(false);
      expect(EntityImpl.validate({})).toBe(false);
    });

    it('should add _id and _obtained_at to the schema', () => {
      let user = new EntityImpl({ id: '1' });
      expect(user).toHaveProperty('id', '1');
      expect(user).toHaveProperty('obtained_at', expect.any(Date));

      user = EntityImpl.from({ id: '1' });
      expect(user).toHaveProperty('id', '1');
      expect(user).toHaveProperty('obtained_at', expect.any(Date));
    });
  });

  describe('Reactable', () => {
    const schema = z.object({ id: z.string(), reactions: reactable });

    class EntityImpl extends Entity<typeof schema> implements Reactable {
      protected static schema = schema;

      hasReactions: () => boolean = () => this.data.reactions.total_count > 0;
      reactions: Reaction[] = [];
      repository: string = 'test';

      constructor(data: Record<string, any>) {
        super(data);
      }

      get id() {
        return this.data.id;
      }
    }

    it('should identify entities with reactions', () => {
      expect(
        new EntityImpl({
          id: '1',
          reactions: {
            url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/103386457/reactions',
            total_count: 2,
            '+1': 0,
            '-1': 0,
            laugh: 0,
            hooray: 0,
            confused: 0,
            heart: 0,
            rocket: 1,
            eyes: 1
          }
        }).hasReactions()
      ).toBe(true);
    });
  });
});
