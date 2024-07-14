import { describe, expect, it } from '@jest/globals';
import { assetSchema } from './asset.js';

describe('Asset entity', () => {
  const baseFields = {
    url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/assets/108642925',
    id: 108642925,
    node_id: 'RA_kwDOAToIks4GecJt',
    name: 'kubernetes.tar.gz',
    content_type: 'application/x-gzip',
    state: 'uploaded',
    size: 528255,
    download_count: 94,
    created_at: '2023-05-17T21:55:23Z',
    updated_at: '2023-05-17T21:55:24Z',
    browser_download_url:
      'https://github.com/kubernetes/kubernetes/releases/download/v1.26.5/kubernetes.tar.gz'
  };

  it('should validate required fields', () => {
    expect(() => assetSchema.parse(baseFields)).not.toThrowError();
    for (const key of Object.keys(baseFields)) {
      expect(() => assetSchema.parse({ ...baseFields, [key]: undefined })).toThrowError();
    }
  });

  it('should validate optional fields', () => {
    expect(assetSchema.parse({ ...baseFields, label: 'Kubernetes Source Code' })).toHaveProperty(
      'label',
      'Kubernetes Source Code'
    );

    expect(
      assetSchema.parse({
        ...baseFields,
        uploader: {
          login: 'k8s-release-robot',
          id: 33505452,
          node_id: 'MDQ6VXNlcjMzNTA1NDUy',
          avatar_url: 'https://avatars.githubusercontent.com/u/33505452?v=4',
          url: 'https://api.github.com/users/k8s-release-robot',
          type: 'User',
          site_admin: false
        }
      })
    ).toHaveProperty('uploader', expect.objectContaining({ id: 33505452 }));
  });

  it('should parse assets from release list', () => {
    expect(
      assetSchema.parse({
        url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/assets/108642925',
        id: 108642925,
        node_id: 'RA_kwDOAToIks4GecJt',
        name: 'kubernetes.tar.gz',
        label: 'Kubernetes Source Code',
        uploader: {
          login: 'k8s-release-robot',
          id: 33505452,
          node_id: 'MDQ6VXNlcjMzNTA1NDUy',
          avatar_url: 'https://avatars.githubusercontent.com/u/33505452?v=4',
          url: 'https://api.github.com/users/k8s-release-robot',
          html_url: 'https://github.com/k8s-release-robot',
          followers_url: 'https://api.github.com/users/k8s-release-robot/followers',
          following_url: 'https://api.github.com/users/k8s-release-robot/following{/other_user}',
          gists_url: 'https://api.github.com/users/k8s-release-robot/gists{/gist_id}',
          starred_url: 'https://api.github.com/users/k8s-release-robot/starred{/owner}{/repo}',
          subscriptions_url: 'https://api.github.com/users/k8s-release-robot/subscriptions',
          organizations_url: 'https://api.github.com/users/k8s-release-robot/orgs',
          repos_url: 'https://api.github.com/users/k8s-release-robot/repos',
          events_url: 'https://api.github.com/users/k8s-release-robot/events{/privacy}',
          received_events_url: 'https://api.github.com/users/k8s-release-robot/received_events',
          type: 'User',
          site_admin: false
        },
        content_type: 'application/x-gzip',
        state: 'uploaded',
        size: 528255,
        download_count: 94,
        created_at: '2023-05-17T21:55:23Z',
        updated_at: '2023-05-17T21:55:24Z',
        browser_download_url:
          'https://github.com/kubernetes/kubernetes/releases/download/v1.26.5/kubernetes.tar.gz'
      })
    ).toEqual({
      url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/assets/108642925',
      id: 108642925,
      node_id: 'RA_kwDOAToIks4GecJt',
      name: 'kubernetes.tar.gz',
      label: 'Kubernetes Source Code',
      uploader: expect.objectContaining({ id: 33505452 }),
      content_type: 'application/x-gzip',
      state: 'uploaded',
      size: 528255,
      download_count: 94,
      created_at: new Date('2023-05-17T21:55:23Z'),
      updated_at: new Date('2023-05-17T21:55:24Z'),
      browser_download_url:
        'https://github.com/kubernetes/kubernetes/releases/download/v1.26.5/kubernetes.tar.gz'
    });
  });

  it('should allow uploader to be a number', () => {
    expect(() => assetSchema.parse({ ...baseFields, uploader: 33505452 })).not.toThrowError();
  });
});
