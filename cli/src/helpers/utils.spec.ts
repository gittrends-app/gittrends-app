import { describe, expect, it } from '@jest/globals';
import { cleanNulls } from './utils.js';

describe('cleanNulls', () => {
  it('should remove null values from the object', () => {
    const data = {
      a: 1,
      b: null,
      c: 'test',
      d: null,
      e: undefined,
      f: 0
    };

    const expected = {
      a: 1,
      c: 'test',
      e: undefined,
      f: 0
    };

    expect(cleanNulls(data)).toEqual(expected);
  });

  it('should return an empty object if all values are null', () => {
    const data = {
      a: null,
      b: null
    };

    const expected = {};

    expect(cleanNulls(data)).toEqual(expected);
  });

  it('should return the same object if there are no null values', () => {
    const data = {
      a: 1,
      b: 'test',
      c: true
    };

    const expected = {
      a: 1,
      b: 'test',
      c: true
    };

    expect(cleanNulls(data)).toEqual(expected);
  });
});
