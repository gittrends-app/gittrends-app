import sanitize from './sanitize.js';

describe('sanitize', () => {
  it('should remove null and empty string values at root', () => {
    expect(sanitize({ a: null, b: '', c: 'c', d: 'd' })).toEqual({ c: 'c', d: 'd' });
  });

  it('should remove null and empty string values in nested objects', () => {
    expect(sanitize({ a: { b: null, c: '', d: 'd' } })).toEqual({ a: { d: 'd' } });
  });
});
