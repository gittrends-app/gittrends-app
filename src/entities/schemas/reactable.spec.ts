import { describe, expect, it } from '@jest/globals';
import schema from './reactable.js';

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

  it('should remove unknown fields', () => {
    expect(schema.parse({ ...baseFields, description: null })).not.toHaveProperty('description');
  });

  it('should remove fields with value 0', () => {
    expect(schema.parse({ ...baseFields, '+1': 0 })).not.toHaveProperty('+1');
    expect(schema.parse({ ...baseFields, '-1': 0 })).not.toHaveProperty('-1');
  });

  it('should keep total_count', () => {
    expect(schema.parse({})).toEqual({ total_count: 0 });
  });
});
