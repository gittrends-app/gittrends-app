/**
 *
 */
export interface Fragment<R = any> {
  readonly alias: string;
  readonly fragments: Fragment[];
  toString(): string;
  transform(data: any): R;
}

/**
 *
 */
export interface QueryLookup<R = any> {
  readonly alias: string;
  readonly fragments: Fragment[];
  toString(): string;
  transform(data: any): R;
}
