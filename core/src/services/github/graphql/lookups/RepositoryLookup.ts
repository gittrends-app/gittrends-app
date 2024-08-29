import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class RepositoryLookup extends QueryLookup<z.infer<typeof repository>, { byName?: boolean }> {
  constructor(
    private id: string,
    private props?: { alias?: string; byName?: boolean }
  ) {
    super(props?.alias || id.replace(/[^a-zA-Z0-9]/g, ''), { id, byName: props?.byName });
    this.fragments.push(new RepositoryFragment('RepoFrag', true));
  }

  toString(): string {
    if (this.props?.byName) {
      const [owner, name] = this.id.split('/');
      return `${this.alias}:repository(owner: "${owner}", name: "${name}") { ...RepoFrag }`;
    } else {
      return `${this.alias}:node(id: "${this.id}") { ...RepoFrag }`;
    }
  }

  parse(data: any) {
    return {
      data: data && this.fragments[0].parse(data[this.alias] || data),
      params: this.params
    };
  }
}
