import { Tag } from '@octokit/graphql-schema';
import { z } from 'zod';
import tag from '../../../../entities/schemas/tag.js';
import { Fragment } from '../Query.js';
import { ActorFragment, PartialActorFragment } from './ActorFragment.js';
import { CommitFragment, PartialCommitFragment } from './CommitFragment.js';

/**
 *  A fragment to get a tag.
 */
class _TagFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  constructor(
    public alias = 'TagFrag',
    full = false
  ) {
    this.fragments.push(full ? ActorFragment : PartialActorFragment);
    this.fragments.push(full ? CommitFragment : PartialCommitFragment);
  }

  toString(): string {
    return `
      fragment ${this.alias} on Tag {
        id
        message
        name
        oid
        repository { id }
        tagger {
          date
          email
          name
          user { ...${this.fragments[0].alias} }
        }
        target { ...${this.fragments[1].alias} }
      }
    `;
  }

  parse(data: Tag): z.infer<typeof tag> {
    return tag.parse({
      id: data.id,
      message: data.message,
      name: data.name,
      oid: data.oid,
      repository: data.repository.id,
      tagger: data.tagger && {
        ...data.tagger,
        user: data.tagger.user && this.fragments[0].parse(data.tagger.user)
      },
      target: data.target && this.fragments[1].parse(data.target)
    });
  }
}

export const TagFragment = new _TagFragment('TagFragment', true);
export const PartialTagFragment = new _TagFragment('PartialTagFragment', false);
