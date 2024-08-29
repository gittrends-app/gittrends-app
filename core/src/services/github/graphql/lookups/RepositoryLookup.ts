import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class RepositoryLookup implements QueryLookup {
  readonly alias: string;
  readonly fragments = [new RepositoryFragment('RepoFrag')];

  constructor(
    private id: string,
    private props?: { alias?: string; byName?: boolean }
  ) {
    this.alias = props?.alias || id.replace(/[^a-zA-Z0-9]/g, '');
  }

  toString(): string {
    if (this.props?.byName) {
      const [owner, name] = this.id.split('/');
      return `${this.alias}:repository(owner: "${owner}", name: "${name}") { ...RepoFrag }`;
    } else {
      return `${this.alias}:node(id: "${this.id}") { ...RepoFrag }`;
    }
  }

  transform(data: any): z.infer<typeof repository> {
    return this.fragments[0].transform(data[this.alias] || data);
  }
}
