import cloneDeep from 'lodash/cloneDeep.js';
import isPlainObject from 'lodash/isPlainObject.js';
import mapValues from 'lodash/mapValues.js';
import { User } from '../entities/user.js';

/**
 *
 */
export function extract<T = any>(entity: T): { data: T; users: User[] } {
  let data: any = entity;
  const users: User[] = [];

  if (isPlainObject(entity)) {
    data = mapValues(entity as object, (value: any) => {
      const res = extract(value);
      users.push(...res.users);

      if (isPlainObject(res.data)) {
        if (res.data.__typename === 'User') {
          users.push(cloneDeep(res.data));
          return res.data.id;
        }
      }

      if (Array.isArray(res.data)) {
        return res.data.map((item) => {
          if (isPlainObject(item) && item.__typename === 'User') {
            users.push(cloneDeep(item));
            return item.id;
          } else {
            return item;
          }
        });
      }

      return res.data;
    });
  }

  if (Array.isArray(entity)) {
    data = entity.map((item) => {
      const res = extract(item);
      users.push(...res.users);

      if (isPlainObject(item)) {
        if (item.__typename === 'User') {
          users.push(cloneDeep(item));
          return item.id;
        }
      }

      return res.data;
    });
  }

  return { data, users };
}
