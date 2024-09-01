import { Tag } from '@octokit/graphql-schema';
import { z } from 'zod';
import tag from '../../../../entities/schemas/tag.js';
import { ActorFragment } from './ActorFragment.js';
import { CommitFragment } from './CommitFragment.js';
import { Fragment, FragmentFactory } from './Fragment.js';

/**
 *  A fragment to get a tag.
 */
export class TagFragment implements Fragment {
  readonly fragments: Fragment[] = [];

  constructor(
    public alias = 'TagFrag',
    opts: { factory: FragmentFactory }
  ) {
    this.fragments.push(opts.factory.create(ActorFragment));
    this.fragments.push(opts.factory.create(CommitFragment));
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
