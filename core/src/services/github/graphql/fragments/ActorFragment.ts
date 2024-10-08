import { Bot, EnterpriseUserAccount, Mannequin, Organization, User } from '@octokit/graphql-schema';
import snakeCase from 'lodash/snakeCase.js';
import { Actor, ActorSchema } from '../../../../entities/Actor.js';
import { Fragment } from './Fragment.js';

/**
 * A fragment to select the common fields for an actor.
 */
export class ActorFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  constructor(
    public alias = 'ActorFragment',
    private opts?: { full?: boolean }
  ) {}

  toString(): string {
    return this.opts?.full
      ? `
    fragment ${this.alias}_User on User {
      bio
      company
      createdAt
      databaseId
      email
      hasSponsorsListing
      isBountyHunter
      isCampusExpert
      isDeveloperProgramMember
      isEmployee
      isGitHubStar
      isHireable
      isSiteAdmin
      location
      name
      pronouns
      socialAccounts(first: 100) { 
        nodes { provider displayName } 
      }
      twitterUsername
      updatedAt
      websiteUrl
      
      followers { totalCount }
      following { totalCount }
      gists { totalCount }
      issues { totalCount }
      organizations { totalCount }
      pullRequests { totalCount }
      repositories { totalCount }
      repositoriesContributedTo { totalCount }
      repositoryDiscussions { totalCount }
      sponsoring { totalCount }
      sponsors { totalCount }
      starredRepositories { totalCount }
      watching { totalCount }
    }

    fragment ${this.alias} on Actor {
      ... on Node { id }
      login
      avatarUrl
      __typename
      
      ... on Bot {
        createdAt
        databaseId
        updatedAt
      }
      
      ... on Mannequin {
        claimant { ...${this.alias}_User }
        createdAt
        databaseId
        email
        updatedAt
      }
      
      ... on EnterpriseUserAccount {
        name
        updatedAt
        user { ...${this.alias}_User }
      }
      
      ... on User { ...${this.alias}_User }
      
      ... on Organization {
        archivedAt
        createdAt
        databaseId
        description
        email
        hasSponsorsListing
        isVerified
        location
        name
        twitterUsername
        updatedAt
        websiteUrl
        
        membersWithRole { totalCount }
        repositories { totalCount }
        sponsoring { totalCount }
        sponsors { totalCount }
      }
    }
    `
      : `
    fragment ${this.alias} on Actor {
      ... on Node { id }
      login
      avatarUrl
      __typename

      ... on User {
        bio
        company
        createdAt
        databaseId
        email
        hasSponsorsListing
        isBountyHunter
        isCampusExpert
        isDeveloperProgramMember
        isEmployee
        isGitHubStar
        isHireable
        isSiteAdmin
        location
        name
        pronouns
        twitterUsername
        websiteUrl
      }

      ... on Organization {
        archivedAt
        createdAt
        databaseId
        description
        email
        hasSponsorsListing
        isVerified
        location
        name
        twitterUsername
        websiteUrl
      }
    }
    `;
  }

  parse(data: Bot | Mannequin | EnterpriseUserAccount | Organization | User): Actor {
    switch (data.__typename) {
      case 'Bot':
        return ActorSchema.parse({
          __typename: data.__typename,
          avatar_url: data.avatarUrl,
          created_at: data.createdAt,
          database_id: data.databaseId as number,
          id: data.id,
          login: data.login,
          updated_at: data.updatedAt
        });
      case 'Mannequin':
        return ActorSchema.parse({
          __typename: data.__typename,
          avatar_url: data.avatarUrl,
          claimant: data.claimant ? (this.parse(data.claimant) as any) : undefined,
          created_at: data.createdAt,
          database_id: data.databaseId,
          email: data.email,
          id: data.id,
          login: data.login,
          updated_at: data.updatedAt
        });
      case 'EnterpriseUserAccount':
        return ActorSchema.parse({
          __typename: data.__typename,
          avatar_url: data.avatarUrl,
          name: data.name as string,
          updated_at: data.updatedAt,
          user: data.user && (this.parse(data.user) as any),
          id: data.id,
          login: data.login
        });
      case 'Organization':
        return ActorSchema.parse({
          __typename: data.__typename,
          avatar_url: data.avatarUrl,
          created_at: data.createdAt,
          database_id: data.databaseId,
          description: data.description,
          email: data.email,
          has_sponsors_listing: data.hasSponsorsListing,
          id: data.id,
          is_verified: data.isVerified,
          location: data.location,
          login: data.login,
          name: data.name,
          twitter_username: data.twitterUsername,
          updated_at: data.updatedAt,
          website_url: data.websiteUrl,
          members_with_role_count: data.membersWithRole?.totalCount,
          repositories_count: data.repositories?.totalCount,
          sponsoring_count: data.sponsoring?.totalCount,
          sponsors_count: data.sponsors?.totalCount,
          archived_at: data.archivedAt ? data.archivedAt : undefined
        });
      case 'User':
        return ActorSchema.parse({
          __typename: data.__typename,
          avatar_url: data.avatarUrl,
          bio: data.bio,
          company: data.company,
          created_at: data.createdAt,
          database_id: data.databaseId as number,
          email: data.email,
          followers_count: data.followers?.totalCount,
          following_count: data.following?.totalCount,
          gists_count: data.gists?.totalCount,
          id: data.id,
          issues_count: data.issues?.totalCount,
          location: data.location,
          login: data.login,
          name: data.name,
          pronouns: data.pronouns,
          pull_requests_count: data.pullRequests?.totalCount,
          repositories_count: data.repositories?.totalCount,
          repositories_contributed_to_count: data.repositoriesContributedTo?.totalCount,
          repository_discussions_count: data.repositoryDiscussions?.totalCount,
          sponsoring_count: data.sponsoring?.totalCount,
          sponsors_count: data.sponsors?.totalCount,
          starred_repositories_count: data.starredRepositories?.totalCount,
          twitter_username: data.twitterUsername,
          updated_at: data.updatedAt,
          website_url: data.websiteUrl,
          watching_count: data.watching?.totalCount,
          is_bounty_hunter: data.isBountyHunter,
          is_campus_expert: data.isCampusExpert,
          is_developer_program_member: data.isDeveloperProgramMember,
          is_employee: data.isEmployee,
          is_git_hub_star: data.isGitHubStar,
          is_hireable: data.isHireable,
          is_site_admin: data.isSiteAdmin,
          has_sponsors_listing: data.hasSponsorsListing,
          social_accounts: data.socialAccounts?.nodes?.reduce(
            (acc: Record<string, string> | undefined, node) =>
              node ? { ...(acc || {}), [snakeCase(node.provider)]: node.displayName } : acc,
            undefined
          ),
          organizations_count: data.organizations?.totalCount
        });
      default:
        throw new Error(`Unexpected actor __typename: ${data.__typename}`);
    }
  }
}
