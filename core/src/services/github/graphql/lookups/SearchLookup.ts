import { z } from 'zod';
import repository from '../../../../entities/schemas/repository.js';
import { RepositoryFragment } from '../fragments/RepositoryFragment.js';
import { QueryLookup } from '../Query.js';

/**
 *  A lookup to get a user by ID.
 */
export class SearchLookup implements QueryLookup {
  readonly alias: string;
  readonly fragments = [new RepositoryFragment('RepoFrag')];

  constructor(private props?: { page?: string; per_page?: number; alias?: string }) {
    this.alias = props?.alias || 'search';
  }

  toString(): string {
    const query = ['stars:1..*', 'sort:stars-desc'];

    return `
    query {
      ${this.alias}:search(first: ${this.props?.per_page || 100}, type: REPOSITORY, query: "${query.join(' ')}") {
        nodes { ...RepositoryFrag }
      }
    }
    `;
  }

  transform(data: any): { repositories: z.infer<typeof repository>[] } {
    return {
      repositories: (data[this.alias] || data).nodes.map(this.fragments[0].transform)
    };
  }
}
