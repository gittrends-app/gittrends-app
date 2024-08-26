import { Entity } from '../entities/Entity.js';
import { Iterable, PageableParams } from '../services/service.js';

/**
 *  Converts an iterable operation into an async function that returns an array of data and the params.
 */
export function toArray<T extends Entity, P extends object>(
  iterableOp: (...args: any) => Iterable<T, P>
): (...args: any) => Promise<{ data: T[]; params: PageableParams & P }> {
  const data: T[] = [];
  let params: PageableParams & P;

  return async function (...args: any): Promise<{ data: T[]; params: PageableParams & P }> {
    const iterable = iterableOp(...args);

    for await (const res of iterable) {
      data.push(...res.data);
      params = res.params;
    }

    return { data, params };
  };
}
