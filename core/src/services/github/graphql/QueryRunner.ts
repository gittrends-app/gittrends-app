import { GraphqlResponseError } from '@octokit/graphql';
import sanitize from '../../../helpers/sanitize.js';
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
 * GraphqlQuery is a wrapper around the GraphqlClient.query method.
 */
export class QueryRunner {
  private constructor(private readonly client: GithubClient) {}

  public static create(client: GithubClient): QueryRunner {
    return new QueryRunner(client);
  }

  public static toString(lookup: QueryLookup<any, any>): string {
    return `query { 
      ${lookup.toString()} 
    }
      
    ${[
      ...new Set(
        lookup.fragments
          .map(resolveFragment)
          .flat()
          .map((fragment) => fragment.toString())
      )
    ].join('\n')}
    `;
  }

  public async fetch<R, P>(lookup: QueryLookup<R, P>) {
    const response = await this.client.graphql<Record<string, any>>(QueryRunner.toString(lookup), {}).catch((error) => {
      if (error.response?.status === 200 || error instanceof GraphqlResponseError) {
        const onlyNotFound = (error.response.errors as Array<{ type: string }>).every(
          (err) => err.type === 'NOT_FOUND'
        );
        if (onlyNotFound) return error.data;

        const onlyForbidden = (error.response.errors as Array<{ type: string }>).every(
          (err) => err.type === 'FORBIDDEN'
        );
        if (onlyForbidden) return sanitize(error.data, (v) => v === null, true);
      }
      throw Object.assign(error, { lookup });
    });

    return lookup.parse(response[lookup.alias]);
  }

  public async fetchAll<R, P>(lookup: QueryLookup<R, P>) {
    const responses: ReturnType<(typeof lookup)['parse']>[] = [];
    for await (const res of this.iterator(lookup)) responses.push(res);

    return { data: responses.map((res) => res.data).flat(), params: responses.at(-1)!.params };
  }

  iterator<R, P>(lookup: QueryLookup<R, P>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self: QueryRunner = this;

    return {
      [Symbol.asyncIterator]: async function* () {
        do {
          const response = await self.fetch(lookup);
          yield response;

          if (!response.next) break;
          else lookup = response.next;
        } while (true);
      }
    };
  }
}
