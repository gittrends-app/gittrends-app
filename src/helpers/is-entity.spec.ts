import { describe } from '@jest/globals';
import { schemas } from '../entities/entity';
import isEntity from './is-entity';

describe('is-entity', () => {
  describe('user', () => {
    const user = schemas.user({
      login: 'danielbruns',
      id: 1478925,
      node_id: 'MDQ6VXNlcjE0Nzg5MjU=',
      avatar_url: 'https://avatars.githubusercontent.com/u/1478925?v=4',
      url: 'https://api.github.com/users/danielbruns',
      type: 'User',
      site_admin: false
    });

    it('should validate user', () => {
      expect(isEntity.user(user)).toBeTruthy();
      expect(isEntity.user(user)).toHaveProperty('__typename', 'User');
    });

    it('should not validate invalid user', () => {
      expect(isEntity.user({ ...user, login: undefined })).toBe(false);
      expect(isEntity.user({ ...user, id: undefined })).toBe(false);
    });
  });

  describe('reaction', () => {
    const reaction = schemas.reaction({
      id: 1,
      node_id: 'MDg6UmVhY3Rpb24x',
      user: {
        login: 'octocat',
        id: 1,
        node_id: 'MDQ6VXNlcjE=',
        avatar_url: 'https://github.com/images/error/octocat_happy.gif',
        gravatar_id: '',
        url: 'https://api.github.com/users/octocat',
        html_url: 'https://github.com/octocat',
        followers_url: 'https://api.github.com/users/octocat/followers',
        following_url: 'https://api.github.com/users/octocat/following{/other_user}',
        gists_url: 'https://api.github.com/users/octocat/gists{/gist_id}',
        starred_url: 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
        subscriptions_url: 'https://api.github.com/users/octocat/subscriptions',
        organizations_url: 'https://api.github.com/users/octocat/orgs',
        repos_url: 'https://api.github.com/users/octocat/repos',
        events_url: 'https://api.github.com/users/octocat/events{/privacy}',
        received_events_url: 'https://api.github.com/users/octocat/received_events',
        type: 'User',
        site_admin: false
      },
      content: 'heart',
      created_at: '2016-05-20T20:09:31Z',
      __repository: 123456789,
      __reactable_name: 'Release',
      __reactable_id: 'abcdef123456'
    });

    it('should validate reaction', () => {
      expect(isEntity.reaction(reaction)).toBeTruthy();
      expect(isEntity.reaction(reaction)).toHaveProperty('__typename', 'Reaction');
    });

    it('should not validate invalid reaction', () => {
      expect(isEntity.reaction({ ...reaction, id: undefined })).toBe(false);
      expect(isEntity.reaction({ ...reaction, node_id: undefined })).toBe(false);
      expect(isEntity.reaction({ ...reaction, content: 'unknown_content' })).toBe(false);
    });
  });
});
