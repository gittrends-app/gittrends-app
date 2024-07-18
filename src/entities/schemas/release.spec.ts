import { describe, expect, it } from '@jest/globals';
import releaseSchema from './release.js';

describe('Release entity', () => {
  const baseFields = {
    url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/163589377',
    id: 163589377,
    author: {
      login: 'k8s-release-robot',
      id: 33505452,
      node_id: 'MDQ6VXNlcjMzNTA1NDUy',
      avatar_url: 'https://avatars.githubusercontent.com/u/33505452?v=4',
      url: 'https://api.github.com/users/k8s-release-robot',
      type: 'User',
      site_admin: false
    },
    node_id: 'RE_kwDOAToIks4JwC0B',
    tag_name: 'v1.31.0-alpha.3',
    target_commitish: 'master',
    draft: false,
    prerelease: true,
    created_at: '2024-07-02T09:43:58Z',
    assets: []
  };

  it('should validate required fields', () => {
    expect(() => releaseSchema.parse(baseFields)).not.toThrowError();
    for (const key of Object.keys(baseFields)) {
      expect(() => releaseSchema.parse({ ...baseFields, [key]: undefined })).toThrowError();
    }
  });

  it('should parse results from search', () => {
    expect(
      releaseSchema.parse({
        url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/103386457',
        assets_url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/103386457/assets',
        upload_url:
          'https://uploads.github.com/repos/kubernetes/kubernetes/releases/103386457/assets{?name,label}',
        html_url: 'https://github.com/kubernetes/kubernetes/releases/tag/v1.26.5',
        id: 103386457,
        author: {
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
        node_id: 'RE_kwDOAToIks4GKY1Z',
        tag_name: 'v1.26.5',
        target_commitish: 'master',
        name: 'Kubernetes v1.26.5',
        draft: false,
        prerelease: false,
        created_at: '2023-05-17T14:08:49Z',
        published_at: '2023-05-17T21:55:19Z',
        assets: [
          {
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
              following_url:
                'https://api.github.com/users/k8s-release-robot/following{/other_user}',
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
          }
        ],
        tarball_url: 'https://api.github.com/repos/kubernetes/kubernetes/tarball/v1.26.5',
        zipball_url: 'https://api.github.com/repos/kubernetes/kubernetes/zipball/v1.26.5',
        body: '\nSee [kubernetes-announce@](https://groups.google.com/forum/#!forum/kubernetes-announce). Additional binary downloads are linked in the [CHANGELOG](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.26.md).\n\nSee [the CHANGELOG](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.26.md) for more details.\n\n\n\n',
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
      })
    ).toEqual({
      url: 'https://api.github.com/repos/kubernetes/kubernetes/releases/103386457',
      id: 103386457,
      author: expect.objectContaining({ id: 33505452 }),
      node_id: 'RE_kwDOAToIks4GKY1Z',
      tag_name: 'v1.26.5',
      target_commitish: 'master',
      name: 'Kubernetes v1.26.5',
      draft: false,
      prerelease: false,
      created_at: new Date('2023-05-17T14:08:49Z'),
      published_at: new Date('2023-05-17T21:55:19Z'),
      assets: [expect.objectContaining({ id: 108642925 })],
      body: '\nSee [kubernetes-announce@](https://groups.google.com/forum/#!forum/kubernetes-announce). Additional binary downloads are linked in the [CHANGELOG](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.26.md).\n\nSee [the CHANGELOG](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.26.md) for more details.\n\n\n\n',
      reactions: expect.objectContaining({ total_count: 2 })
    });
  });

  it('should allow author to be a number', () => {
    expect(() => releaseSchema.parse({ ...baseFields, author: 33505452 })).not.toThrowError();
  });
});
