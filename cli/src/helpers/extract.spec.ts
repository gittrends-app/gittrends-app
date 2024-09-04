import { ActorSchema, Organization, User } from '@/core/entities/index.js';
import { describe, expect, it } from '@jest/globals';
import { extract } from './extract.js';

describe('extract', () => {
  const user: User = {
    __typename: 'User',
    id: '1',
    name: 'John Doe',
    avatar_url: 'https://example.com/avatar.jpg',
    login: 'johndoe'
  };

  const org: Organization = {
    __typename: 'Organization',
    id: '1',
    name: 'ACME',
    avatar_url: 'https://example.com/acme.jpg',
    login: 'acme'
  };

  it('should extract refs from if root', () => {
    const { data, refs } = extract(user, ActorSchema, (d) => d.id);

    expect(data).toEqual(user.id);
    expect(refs).toEqual([user]);
  });

  it('should extract refs from if on object property', () => {
    const { data, refs } = extract({ user }, ActorSchema, (d) => d.id);

    expect(data).toEqual({ user: user.id });
    expect(refs).toEqual([user]);
  });

  it('should extract refs from if on array', () => {
    const { data, refs } = extract([user], ActorSchema, (d) => d.id);

    expect(data).toEqual([user.id]);
    expect(refs).toEqual([user]);
  });

  it('should extract refs from if on array inside a object property', () => {
    const { data, refs } = extract({ arr: [user] }, ActorSchema, (d) => d.id);

    expect(data).toEqual({ arr: [user.id] });
    expect(refs).toEqual([user]);
  });

  it('should extract refs from if on object property inside an array', () => {
    const { data, refs } = extract([{ user }], ActorSchema, (d) => d.id);

    expect(data).toEqual([{ user: user.id }]);
    expect(refs).toEqual([user]);
  });

  it('should extract multiple refs', () => {
    const { data, refs } = extract([user, org], ActorSchema, (d) => d.id);

    expect(data).toEqual([user.id, org.id]);
    expect(refs).toEqual([user, org]);
  });
});
