import cloneDeepWith from 'lodash/cloneDeepWith.js';
import isPlainObject from 'lodash/isPlainObject.js';
import mapValues from 'lodash/mapValues.js';
import omitBy from 'lodash/omitBy.js';
import { PartialDeep } from 'type-fest';
import { z, ZodSchema } from 'zod';

/**
 * Sanitize an object by removing null and empty string values.
 */
export default function sanitize<T extends object>(data: T): PartialDeep<T> {
  return cloneDeepWith(data, (value) => {
    return isPlainObject(value)
      ? mapValues(
          omitBy(value, (v) => v === null || v === ''),
          sanitize
        )
      : undefined;
  });
}

/**
 * Preprocess a Zod schema by sanitizing the data before validation.
 */
export function zodSanitize<Z extends ZodSchema>(schema: Z) {
  return z.preprocess<Z>((data: any) => sanitize(data), schema);
}
