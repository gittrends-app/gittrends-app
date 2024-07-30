/* eslint-disable require-jsdoc */
import { describe, expect, it } from '@jest/globals';
import { z } from 'zod';
import { ValidationError } from 'zod-validation-error';
import { Entity, Reactable, Reaction } from './Entity.js';
import reactable from './schemas/reactable.js';

describe('Entities', () => {
  describe('Entity', () => {
    class EntityImpl extends Entity {
      protected static override _schema = z.object({ id: z.string() });

      constructor(data: Record<string, any>) {
        super(data);
      }

      get _id() {
        return (this as any).id;
      }
    }

    it('should throw an error if invalid data is provided', () => {
      expect(() => new EntityImpl({})).toThrowError(ValidationError);
      expect(() => EntityImpl.from({})).toThrowError(ValidationError);
    });

    it('should allow data validation', () => {
      expect(EntityImpl.validate({ id: '1' })).toBe(true);
      expect(EntityImpl.validate({ id: 1 })).toBe(false);
      expect(EntityImpl.validate({})).toBe(false);
    });

    it('should add _id and _obtained_at to the schema', () => {
      let user = new EntityImpl({ id: '1' });
      expect(user).toHaveProperty('_id', '1');
      expect(user).toHaveProperty('_obtained_at', expect.any(Date));

      user = EntityImpl.from({ id: '1' });
      expect(user).toHaveProperty('_id', '1');
      expect(user).toHaveProperty('_obtained_at', expect.any(Date));
    });

    it('should serialize the entity', () => {
      const user = new EntityImpl({ id: '1' });
      expect(user.toJSON()).toEqual({ id: '1', _id: '1', _entityname: 'entity_impl', _obtained_at: user._obtained_at });
    });
  });

  describe('Reactable', () => {
    class EntityImpl extends Entity implements Reactable {
      protected static override _schema = z.object({ id: z.string(), reactions: reactable });

      _reactions: Reaction[] = [];

      get _hasReactions() {
        return (this as any).reactions.total_count > 0;
      }

      constructor(data: Record<string, any>) {
        super(data);
      }

      get _id() {
        return (this as any).id;
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
        })._hasReactions
      ).toBe(true);
    });
  });
});
