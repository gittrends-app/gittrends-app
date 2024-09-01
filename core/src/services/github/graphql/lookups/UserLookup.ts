import { z } from 'zod';
import actor from '../../../../entities/schemas/actor.js';
import { ActorFragment } from '../fragments/ActorFragment.js';
import { QueryLookup } from './Lookup.js';

/**
 *  A lookup to get a user by ID.
 */
export class UserLookup extends QueryLookup<z.infer<typeof actor>, { byLogin?: boolean }> {
  toString(): string {
    return this.params.byLogin
      ? `${this.alias}:repositoryOwner(login: "${this.params.id}") { ...${this.fragments[0].alias} }`
      : `${this.alias}:node(id: "${this.params.id}") { ...${this.fragments[0].alias} }`;
  }

  parse(data: any) {
    return {
      data: data && this.fragments[0].parse(data[this.alias] || data),
      params: this.params
    };
  }

  get fragments() {
    return [this.params.factory.create(ActorFragment)];
  }
}
