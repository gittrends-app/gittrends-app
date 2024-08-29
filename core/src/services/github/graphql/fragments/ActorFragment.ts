import { Bot, EnterpriseUserAccount, Mannequin, Organization, User } from '@octokit/graphql-schema';
import snakeCase from 'lodash/snakeCase.js';
import { z } from 'zod';
import actor from '../../../../entities/schemas/actor.js';
import { Fragment } from '../Query.js';

/**
 * A fragment to select the common fields for an actor.
 */
export class ActorFragment implements Fragment {
  readonly fragments = [];

  constructor(
    public alias = 'ActorFragment',
    private full = false
  ) {}

  toString(): string {
    return this.full
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
      lists { totalCount }
      organizations { totalCount }
      packages { totalCount }
      pinnedItems { totalCount }
      projectsV2 { totalCount }
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
        packages { totalCount }
        pinnedItems { totalCount }
        projectsV2 { totalCount }
        repositories { totalCount }
        sponsoring { totalCount }
        sponsors { totalCount }
        teams { totalCount }
      }
    }
    `
      : `
    fragment ${this.alias} on Actor {
      ... on Node { id }
      login
      avatarUrl
      __typename
    }
    `;
  }

  transform(data: Bot | Mannequin | EnterpriseUserAccount | Organization | User): z.infer<typeof actor> {
    switch (data.__typename) {
      case 'Bot':
        return actor.parse({
          type: data.__typename,
          avatar_url: data.avatarUrl,
          created_at: data.createdAt,
          database_id: data.databaseId as number,
          id: data.id,
          login: data.login,
          updated_at: data.updatedAt
        });
      case 'Mannequin':
        return actor.parse({
          type: data.__typename,
          avatar_url: data.avatarUrl,
          claimant: data.claimant ? (this.transform(data.claimant) as any) : undefined,
          created_at: data.createdAt,
          database_id: data.databaseId || undefined,
          email: data.email || undefined,
          id: data.id,
          login: data.login,
          updated_at: data.updatedAt
        });
      case 'EnterpriseUserAccount':
        return actor.parse({
          type: data.__typename,
          avatar_url: data.avatarUrl,
          name: data.name as string,
          updated_at: data.updatedAt,
          user: data.user && (this.transform(data.user) as any),
          id: data.id,
          login: data.login
        });
      case 'Organization':
        return actor.parse({
          type: data.__typename,
          avatar_url: data.avatarUrl,
          created_at: data.createdAt,
          database_id: data.databaseId || undefined,
          description: data.description || undefined,
          email: data.email || undefined,
          has_sponsors_listing: data.hasSponsorsListing,
          id: data.id,
          is_verified: data.isVerified,
          location: data.location || undefined,
          login: data.login,
          name: data.name || undefined,
          twitter_username: data.twitterUsername || undefined,
          updated_at: data.updatedAt,
          website_url: data.websiteUrl || undefined,
          members_with_role_count: data.membersWithRole?.totalCount,
          packages_count: data.packages?.totalCount,
          pinned_items_count: data.pinnedItems?.totalCount,
          projects_count: data.projectsV2?.totalCount,
          repositories_count: data.repositories?.totalCount,
          sponsoring_count: data.sponsoring?.totalCount,
          sponsors_count: data.sponsors?.totalCount,
          teams_count: data.teams?.totalCount,
          archived_at: data.archivedAt ? data.archivedAt : undefined
        });
      case 'User':
        return actor.parse({
          type: data.__typename,
          avatar_url: data.avatarUrl,
          bio: data.bio || undefined,
          company: data.company || undefined,
          created_at: data.createdAt,
          database_id: data.databaseId as number,
          email: data.email || undefined,
          followers_count: data.followers?.totalCount || 0,
          following_count: data.following?.totalCount || 0,
          gists_count: data.gists?.totalCount || 0,
          id: data.id,
          issues_count: data.issues?.totalCount || 0,
          lists_count: data.lists?.totalCount || 0,
          location: data.location || undefined,
          login: data.login,
          name: data.name || undefined,
          packages_count: data.packages?.totalCount || 0,
          pinned_items_count: data.pinnedItems?.totalCount || 0,
          projects_count: data.projectsV2?.totalCount || 0,
          pronouns: data.pronouns || undefined,
          pull_requests_count: data.pullRequests?.totalCount || 0,
          repositories_count: data.repositories?.totalCount || 0,
          repositories_contributed_to_count: data.repositoriesContributedTo?.totalCount || 0,
          repository_discussions_count: data.repositoryDiscussions?.totalCount || 0,
          sponsoring_count: data.sponsoring?.totalCount || 0,
          sponsors_count: data.sponsors?.totalCount || 0,
          starred_repositories_count: data.starredRepositories?.totalCount || 0,
          twitter_username: data.twitterUsername || undefined,
          updated_at: data.updatedAt,
          website_url: data.websiteUrl || undefined,
          watching_count: data.watching?.totalCount || 0,
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
        throw new Error(`Unexpected actor type: ${data.__typename}`);
    }
  }
}
