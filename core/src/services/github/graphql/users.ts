import { User as GUser } from '@octokit/graphql-schema';
import { PartialDeep } from 'type-fest';
import { User } from '../../../entities/Entity.js';

export default {
  fragment: (name: string) => `
    fragment ${name} on Actor {
      ... on Node { id }
      ... on Bot { 
        databaseId 
        avatarUrl
        createdAt
        updatedAt
      }
      ... on Mannequin { 
        databaseId 
        avatarUrl
        createdAt
        updatedAt
      }
      ... on Organization { 
        databaseId 
        avatarUrl
        name
        websiteUrl
        location
        twitterUsername
        repositories(visibility: PUBLIC) { totalCount }
        createdAt
        updatedAt
      }
      ... on User { 
        databaseId 
        avatarUrl
        isSiteAdmin
        name
        company
        websiteUrl
        location
        email
        isHireable
        bio
        twitterUsername
        repositories { totalCount }
        gists { totalCount }
        followers { totalCount }
        following { totalCount }
        createdAt
        updatedAt
      }
      __typename
      login
    }
  `,
  parse: (data: GUser): PartialDeep<User> => ({
    login: data.login,
    id: data.databaseId || undefined,
    node_id: data.id,
    gravatar_id: data.avatarUrl,
    type: data.__typename,
    site_admin: data.isSiteAdmin,
    name: data.name || undefined,
    company: data.company || undefined,
    blog: data.websiteUrl || undefined,
    location: data.location || undefined,
    email: data.email,
    hireable: data.isHireable,
    bio: data.bio || undefined,
    twitter_username: data.twitterUsername || undefined,
    public_repos: data.repositories.totalCount,
    public_gists: data.gists.totalCount,
    followers: data.followers.totalCount,
    following: data.following.totalCount,
    created_at: data.createdAt,
    updated_at: data.updatedAt
  })
};
