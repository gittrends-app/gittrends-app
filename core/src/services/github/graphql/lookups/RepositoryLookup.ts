import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class RepositoryLookup extends QueryLookup<z.infer<typeof repository> | null, { byName?: boolean }> {
  constructor(
    private id: string,
    private props?: { alias?: string; byName?: boolean }
  ) {
    super(props?.alias || id.replace(/[^a-zA-Z0-9]/g, ''), { id, byName: props?.byName });
    this.fragments.push(RepositoryFragment);
  }

  toString(): string {
    if (this.props?.byName) {
      const [owner, name] = this.id.split('/');
      return `${this.alias}:repository(owner: "${owner}", name: "${name}") { ...${RepositoryFragment.alias} }`;
    } else {
      return `${this.alias}:node(id: "${this.id}") { ...${RepositoryFragment.alias} }`;
    }
  }

  parse(data: any) {
    return {
      data: data ? RepositoryFragment.parse(data[this.alias] || data) : null,
      params: this.params
    };
  }
}
