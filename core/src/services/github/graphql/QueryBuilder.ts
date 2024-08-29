import { GithubClient } from '../client.js';
import { Fragment, QueryLookup } from './Query.js';

/**
 *  Recursively resolve fragments.
 */
function resolveFragment(fragment: Fragment): Fragment[] {
  return [fragment, ...fragment.fragments.flatMap(resolveFragment)];
}

/**
 * GraphqlQuery is a wrapper around the GraphqlClient.query method.
 */
export class QueryBuilder {
  private lookups: QueryLookup[] = [];

  private constructor(private readonly client: GithubClient) {}

  public static create(client: GithubClient): QueryBuilder {
    return new QueryBuilder(client);
  }

  public add(query: QueryLookup): QueryBuilder {
    if (this.lookups.find((lookup) => lookup.alias === query.alias)) {
      throw new Error(`Lookup with alias ${query.alias} already exists.`);
    }
    this.lookups.push(query);
    return this;
  }

  public toString(): string {
    return `query { 
      ${this.lookups.map((lookup) => lookup.toString()).join(' ')} 
    }
      
    ${[
      ...new Set(
        this.lookups
          .map((lookup) => lookup.fragments.map(resolveFragment).flat())
          .flat()
          .map((fragment) => fragment.toString())
      )
    ].join('\n')}
    `;
  }

  async fetch() {
    const response = await this.client.graphql<Record<string, any>>(this.toString(), {});
    return this.lookups.map((lookup) => lookup.transform(response[lookup.alias]));
  }
}
