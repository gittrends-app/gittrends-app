import cloneDeep from 'lodash/cloneDeep.js';
import forIn from 'lodash/forIn.js';
import isPlainObject from 'lodash/isPlainObject.js';
import { z, ZodType } from 'zod';

/**
 *  Checks if a value is an instance of a schema.
 */
function instanceOf<Z extends ZodType>(value: any, schema: Z): value is z.infer<Z> {
  const result = schema.safeParse(value);
  return result.success;
}

/**
 *  Extracts refs from an entity.
 */
export function extract<Z extends ZodType, T = any>(
  entity: T,
  schema: Z,
  replacement: (d: z.infer<Z>) => any
): { data: T; refs: z.infer<Z>[] } {
  let data: any = cloneDeep(entity);

  const refs: T[] = [];

  if (instanceOf(data, schema)) {
    refs.push(data);
    data = replacement(data);
  } else if (isPlainObject(data)) {
    forIn(entity as object, (value: any, key: string) => {
      const res = extract(value, schema, replacement);
      refs.push(...res.refs);
      data[key] = res.data;
    });
  } else if (Array.isArray(entity)) {
    data = entity.map((item) => {
      const res = extract(item, schema, replacement);
      refs.push(...res.refs);
      return res.data;
    });
  }

  return { data, refs };
}
