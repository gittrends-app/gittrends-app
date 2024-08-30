import { z } from 'zod';
import actor from '../../../../entities/schemas/actor.js';
import { ActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class UserLookup extends QueryLookup<z.infer<typeof actor>, { byLogin?: boolean }> {
  constructor(
    private id: string,
    private props?: { alias?: string; byLogin?: boolean }
  ) {
    const { byLogin } = props || {};
    super(props?.alias || id.replace(/[^a-zA-Z0-9]/g, ''), { id, byLogin });
    this.fragments.push(ActorFragment);
  }

  toString(): string {
    return this.props?.byLogin
      ? `${this.alias}:repositoryOwner(login: "${this.id}") { ...${ActorFragment.alias} }`
      : `${this.alias}:node(id: "${this.id}") { ...${ActorFragment.alias} }`;
  }

  parse(data: any) {
    return {
      data: data && ActorFragment.parse(data[this.alias] || data),
      params: this.params
    };
  }
}
