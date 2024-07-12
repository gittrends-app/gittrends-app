import { describe, expect, it } from '@jest/globals';
import { tagSchema } from './tag.js';

describe('Tag entity', () => {
  const baseFields = {
    name: 'v1.26.6',
    commit: {
      sha: '11902a838028edef305dfe2f96be929bc4d114d8',
      url: 'https://api.github.com/repos/kubernetes/kubernetes/commits/11902a838028edef305dfe2f96be929bc4d114d8'
    },
    node_id: 'MDM6UmVmMjA1ODA0OTg6cmVmcy90YWdzL3YxLjI2LjY='
  };

  it('should validate required fields', () => {
    expect(() => tagSchema.parse(baseFields)).not.toThrowError();
    for (const key of Object.keys(baseFields)) {
      expect(() => tagSchema.parse({ ...baseFields, [key]: undefined })).toThrowError();
    }
  });

  it('should add __typename and __obtained_at to tag', () => {
    const result = tagSchema.parse(baseFields);
    expect(result).toHaveProperty('__typename', 'Tag');
    expect(result).toHaveProperty('__obtained_at', expect.any(Date));
  });

  it('should parse commit from search', () => {
    expect(
      tagSchema.parse({
        name: 'v1.26.6',
        zipball_url: 'https://api.github.com/repos/kubernetes/kubernetes/zipball/refs/tags/v1.26.6',
        tarball_url: 'https://api.github.com/repos/kubernetes/kubernetes/tarball/refs/tags/v1.26.6',
        commit: {
          sha: '11902a838028edef305dfe2f96be929bc4d114d8',
          url: 'https://api.github.com/repos/kubernetes/kubernetes/commits/11902a838028edef305dfe2f96be929bc4d114d8'
        },
        node_id: 'MDM6UmVmMjA1ODA0OTg6cmVmcy90YWdzL3YxLjI2LjY='
      })
    ).toEqual({
      name: 'v1.26.6',
      commit: '11902a838028edef305dfe2f96be929bc4d114d8',
      node_id: 'MDM6UmVmMjA1ODA0OTg6cmVmcy90YWdzL3YxLjI2LjY=',
      __typename: 'Tag',
      __obtained_at: expect.any(Date)
    });
  });
});
