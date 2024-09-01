import { GithubClient } from '../client.js';
import { Fragment } from './fragments/Fragment.js';
import { QueryLookup } from './lookups/Lookup.js';

/**
 *  Recursively resolve fragments.
 */
function resolveFragment(fragment: Fragment): Fragment[] {
  return [fragment, ...fragment.fragments.flatMap(resolveFragment)];
}

/**
 *
 */
class FakeQueryLookup extends QueryLookup {
  constructor() {
    super({} as any);
  }
  fragments = [];
  toString = () => '';
  parse = () => ({ data: null, params: {} as any });
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
    const response = await this.client.graphql<Record<string, any>>(this.toString(), {}).catch((error) => {
      if (error.response.status === 200) {
        const onlyNotFound = (error.response.errors as Array<{ type: string }>).every(
          (err) => err.type === 'NOT_FOUND'
        );
        if (onlyNotFound) return error.data;
      }
      throw error;
    });

    return this.lookups.map((lookup) =>
      lookup instanceof FakeQueryLookup ? null : lookup.parse(response[lookup.alias])
    );
  }

  iterator(): AsyncIterable<Awaited<ReturnType<QueryBuilder['fetch']>>> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self: QueryBuilder = this;

    return {
      [Symbol.asyncIterator]: async function* () {
        do {
          const response = await self.fetch();

          yield response;

          const pendingLookups = response.map((lookup) => lookup?.next).filter((lookup) => lookup !== undefined);
          if (pendingLookups.length === 0) break;

          self = response.reduce(
            (builder, lookup) => builder.add(lookup?.next || new FakeQueryLookup()),
            QueryBuilder.create(self.client)
          );
        } while (true);
      }
    };
  }
}
