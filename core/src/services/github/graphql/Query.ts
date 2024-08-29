/**
 *
 */
export interface Fragment<R = any> {
  readonly alias: string;
  readonly fragments: Fragment[];
  toString(): string;
  parse(data: any): R;
}

/**
 *
 */
export type QueryLookupParams = {
  id?: string;
  cursor?: string;
  first?: number;
};

/**
 *
 */
export abstract class QueryLookup<R = any, P = Record<string, any>> {
  readonly alias: string;
  readonly fragments: Fragment[];
  readonly params: QueryLookupParams & P;

  protected constructor(alias: string, params: QueryLookupParams & P) {
    this.alias = alias;
    this.params = params;
    this.fragments = [];
  }

  abstract toString(): string;
  abstract parse(data: any): { next?: QueryLookup<R, P>; data: R; params: QueryLookupParams & P };
}
