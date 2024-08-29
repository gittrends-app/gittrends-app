import { z } from 'zod';
import actor from '../../../../entities/schemas/actor.js';
import { ActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class UserLookup implements QueryLookup {
  readonly alias: string;
  readonly fragments = [new ActorFragment('UserFrag', true)];

  constructor(
    private id: string,
    private props?: { alias?: string; byLogin?: boolean }
  ) {
    this.alias = props?.alias || id.replace(/[^a-zA-Z0-9]/g, '');
  }

  toString(): string {
    return this.props?.byLogin
      ? `${this.alias}:repositoryOwner(login: "${this.id}") { ...UserFrag }`
      : `${this.alias}:node(id: "${this.id}") { ...UserFrag }`;
  }

  transform(data: any): z.infer<typeof actor> {
    return this.fragments[0].transform(data[this.alias] || data);
  }
}
