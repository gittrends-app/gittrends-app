import { describe, expect, it } from '@jest/globals';

import sanitize from './sanitize.js';

describe('sanitize', () => {
  it('should remove null and empty string values at root', () => {
    expect(sanitize({ a: null, b: '', c: 'c', d: 'd' })).toEqual({ c: 'c', d: 'd' });
  });

  it('should remove null and empty string values in nested objects', () => {
    expect(sanitize({ a: { b: null, c: '', d: 'd' } })).toEqual({ a: { d: 'd' } });
  });

  it('should remove empty arrays', () => {
    expect(sanitize({ a: { b: [], c: '', d: 'd' } })).toEqual({ a: { d: 'd' } });
  });

  it('should remove empty objects', () => {
    expect(sanitize({ a: { b: {}, c: '', d: 'd' } })).toEqual({ a: { d: 'd' } });
  });
});