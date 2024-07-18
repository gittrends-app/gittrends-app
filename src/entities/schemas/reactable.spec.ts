import { describe, expect, it } from '@jest/globals';
import reactableSchema from './reactable.js';

describe('Reactable entity', () => {
  const baseFields = {
    total_count: 40,
    '+1': 16,
    '-1': 0,
    laugh: 4,
    hooray: 8,
    confused: 0,
    heart: 5,
    rocket: 4,
    eyes: 3
  };

  it('should validate required fields', () => {
    expect(() => reactableSchema.parse(baseFields)).not.toThrowError();
    for (const key of Object.keys(baseFields)) {
      expect(() => reactableSchema.parse({ ...baseFields, [key]: undefined })).toThrowError();
    }
  });

  it('should remove unknown fields', () => {
    const result = reactableSchema.parse({ ...baseFields, description: null });
    expect(result).not.toHaveProperty('description');
  });
});
