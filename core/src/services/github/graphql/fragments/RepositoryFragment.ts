import { Commit as GsCommit, Repository as GsRepository } from '@octokit/graphql-schema';
import { Repository, RepositorySchema } from '../../../../entities/Repository.js';
import { ActorFragment } from './ActorFragment.js';
import { Fragment, FragmentFactory } from './Fragment.js';

/**
 *  A fragment to get a repository.
 */
export class RepositoryFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  private readonly full: boolean;

  constructor(
    public alias = 'RepositoryFrag',
    opts: { factory: FragmentFactory; full?: boolean }
  ) {
    this.fragments = [opts.factory.create(ActorFragment)];
    this.full = opts.full || false;
  }

  toString(): string {
    return this.full
      ? `
    fragment ${this.alias} on Repository {
      __typename
      allowUpdateBranch
      archivedAt
      assignableUsers { totalCount }
      autoMergeAllowed
      codeOfConduct { key }
      contributingGuidelines { body }
      createdAt
      databaseId
      defaultBranchRef { 
        name 
        target { ... on Commit { history { totalCount } } }
      }
      deleteBranchOnMerge
      deployments { totalCount }
      description
      discussions { totalCount }
      diskUsage
      environments { totalCount }
      forkCount
      forkingAllowed
      fundingLinks { platform url }
      hasDiscussionsEnabled
      hasIssuesEnabled
      hasProjectsEnabled
      hasSponsorshipsEnabled
      hasVulnerabilityAlertsEnabled
      hasWikiEnabled
      homepageUrl
      id
      isArchived
      isBlankIssuesEnabled
      isDisabled
      isEmpty
      isFork
      isInOrganization
      isLocked
      isMirror
      isSecurityPolicyEnabled
      issues { totalCount }
      languages(first: 100) { edges { size node { name } } }
      licenseInfo { key }
      lockReason
      mergeCommitAllowed
      mergeCommitMessage
      mergeCommitTitle
      milestones { totalCount }
      mirrorUrl
      name
      nameWithOwner
      openGraphImageUrl
      owner { ...${this.fragments[0].alias} }
      packages { totalCount }
      parent { id nameWithOwner }
      primaryLanguage { name }
      pullRequests { totalCount }
      pushedAt
      rebaseMergeAllowed
      branches:refs(refPrefix: "refs/heads/") { totalCount }
      tags:refs(refPrefix: "refs/tags/") { totalCount }
      releases { totalCount }
      repositoryTopics(first: 100) { nodes { topic { name } } }
      rulesets { totalCount }
      securityPolicyUrl
      squashMergeAllowed
      squashMergeCommitMessage
      squashMergeCommitTitle
      sshUrl
      stargazerCount
      submodules { totalCount }
      templateRepository { id nameWithOwner }
      updatedAt
      url
      usesCustomOpenGraphImage
      visibility
      vulnerabilityAlerts { totalCount }
      watchers { totalCount }
      webCommitSignoffRequired
    }`
      : `fragment ${this.alias} on Repository {
      __typename
      databaseId
      description
      id
      name
      nameWithOwner
      openGraphImageUrl
      owner { ...${this.fragments[0].alias} }
      primaryLanguage { name }
      stargazerCount
    }`;
  }

  parse(data: GsRepository): Repository {
    return RepositorySchema.parse({
      __typename: data.__typename,
      id: data.id,
      database_id: data.databaseId!,
      description: data.description!,
      name: data.name,
      name_with_owner: data.nameWithOwner,
      open_graph_image_url: data.openGraphImageUrl,
      owner: this.fragments[0].parse(data.owner),
      primary_language: data.primaryLanguage?.name,

      allow_update_branch: data.allowUpdateBranch,
      archived_at: data.archivedAt,
      auto_merge_allowed: data.autoMergeAllowed,
      code_of_conduct: data.codeOfConduct?.key,
      contributing_guidelines: data.contributingGuidelines?.body || undefined,
      created_at: data.createdAt,
      default_branch: data.defaultBranchRef?.name,
      commits_count: (data.defaultBranchRef?.target as GsCommit | undefined)?.history?.totalCount,
      delete_branch_on_merge: data.deleteBranchOnMerge,
      disk_usage: data.diskUsage || undefined,
      forking_allowed: data.forkingAllowed,
      funding_links: data.fundingLinks?.map(({ platform, url }) => ({ platform, url })),
      has_discussions_enabled: data.hasDiscussionsEnabled,
      has_issues_enabled: data.hasIssuesEnabled,
      has_projects_enabled: data.hasProjectsEnabled,
      has_sponsorships_enabled: data.hasSponsorshipsEnabled,
      has_vulnerability_alerts_enabled: data.hasVulnerabilityAlertsEnabled,
      has_wiki_enabled: data.hasWikiEnabled,
      homepage_url: data.homepageUrl,
      is_archived: data.isArchived,
      is_blank_issues_enabled: data.isBlankIssuesEnabled,
      is_disabled: data.isDisabled,
      is_empty: data.isEmpty,
      is_fork: data.isFork,
      is_in_organization: data.isInOrganization,
      is_locked: data.isLocked,
      is_mirror: data.isMirror,
      is_security_policy_enabled: data.isSecurityPolicyEnabled || undefined,
      languages: data.languages?.edges?.map((edge) => ({ name: edge!.node.name, size: edge!.size })),
      license_info: data.licenseInfo?.key,
      lock_reason: data.lockReason || undefined,
      merge_commit_allowed: data.mergeCommitAllowed,
      merge_commit_message: data.mergeCommitMessage || undefined,
      merge_commit_title: data.mergeCommitTitle || undefined,
      mirror_url: data.mirrorUrl || undefined,
      parent: data.parent?.nameWithOwner,
      pushed_at: data.pushedAt,
      rebase_merge_allowed: data.rebaseMergeAllowed,
      repository_topics: data.repositoryTopics?.nodes?.map((node) => node!.topic.name),
      security_policy_url: data.securityPolicyUrl || undefined,
      squash_merge_allowed: data.squashMergeAllowed,
      squash_merge_commit_message: data.squashMergeCommitMessage || undefined,
      squash_merge_commit_title: data.squashMergeCommitTitle || undefined,
      template_repository: data.templateRepository?.nameWithOwner || undefined,
      updated_at: data.updatedAt,
      uses_custom_open_graph_image: data.usesCustomOpenGraphImage,
      visibility: data.visibility,
      web_commit_signoff_required: data.webCommitSignoffRequired,

      assignable_users_count: data.assignableUsers?.totalCount,
      deployments_count: data.deployments?.totalCount,
      discussions_count: data.discussions?.totalCount,
      environments_count: data.environments?.totalCount,
      issues_count: data.issues?.totalCount,
      milestones_count: data.milestones?.totalCount,
      pull_requests_count: data.pullRequests?.totalCount,
      branches_count: (data as any).branches?.totalCount,
      fork_count: data.forkCount,
      packages_count: data.packages?.totalCount,
      releases_count: data.releases?.totalCount,
      tags_count: (data as any).tags?.totalCount,
      rulesets_count: data.rulesets?.totalCount,
      stargazers_count: data.stargazerCount,
      submodules_count: data.submodules?.totalCount,
      vulnerability_alerts_count: data.vulnerabilityAlerts?.totalCount,
      watchers_count: data.watchers?.totalCount
    });
  }
}
