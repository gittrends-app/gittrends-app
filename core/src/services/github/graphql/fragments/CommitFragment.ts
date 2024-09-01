import { Commit } from '@octokit/graphql-schema';
import { z } from 'zod';
import commit from '../../../../entities/schemas/commit.js';
import { ActorFragment } from './ActorFragment.js';
import { Fragment, PartialFragmentFactory } from './Fragment.js';

/**
 *  A fragment to get a commit.
 */
export class CommitFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  constructor(
    public alias = 'CommitFrag',
    opts: { factory: PartialFragmentFactory }
  ) {
    this.fragments.push(opts.factory.create(ActorFragment));
  }

  toString(): string {
    return `
      fragment ${this.alias} on Commit {
        additions
        author {
          date
          email
          name
          user { ...${this.fragments[0].alias} }
        }
        authoredByCommitter
        authoredDate
        changedFilesIfAvailable
        comments { totalCount }
        committedDate
        committedViaWeb
        committer {
          date
          email
          name
          user { ...${this.fragments[0].alias} }
        }
        deletions
        deployments { totalCount }
        id
        message
        messageBody
        messageHeadline
        oid
        parents(first: 100) { nodes { id } }
        repository { id }
        status { state }
      }
    `;
  }

  parse(data: Commit): z.infer<typeof commit> {
    return commit.parse({
      additions: data.additions,
      author: data.author && {
        ...data.author,
        user: data.author.user && this.fragments[0].parse(data.author.user)
      },
      authored_by_committer: data.authoredByCommitter,
      authored_date: data.authoredDate,
      changed_files_if_available: data.changedFilesIfAvailable,
      comments_count: data.comments.totalCount,
      committed_date: data.committedDate,
      committed_via_web: data.committedViaWeb,
      committer: data.committer && {
        ...data.committer,
        user: data.committer.user && this.fragments[0].parse(data.committer.user)
      },
      deletions: data.deletions,
      deployments_count: data.deployments!.totalCount,
      id: data.id,
      message: data.message,
      message_body: data.messageBody,
      message_headline: data.messageHeadline,
      oid: data.oid,
      parents: data.parents!.nodes?.map((node) => node!.id),
      repository: data.repository.id,
      status: data.status && data.status.state
    });
  }
}
