import isPlainObject from 'lodash/isPlainObject.js';
import mapValues from 'lodash/mapValues.js';
import { User } from '../entities/entity.js';
import isEntity from './is-entity.js';

/**
 *  Extracts users from an entity.
 */
export function extract<T = any>(entity: T): { data: T; users: User[] } {
  let data: any = entity;
  const users: User[] = [];

  if (isPlainObject(entity)) {
    data = mapValues(entity as object, (value: any) => {
      const res = extract(value);
      users.push(...res.users);

      if (isPlainObject(res.data)) {
        const user = isEntity.user(res.data);
        if (user) {
          users.push(user);
          return user.id;
        }
      }

      if (Array.isArray(res.data)) {
        return res.data.map((item) => {
          const user = isEntity.user(item);
          if (user) {
            users.push(user);
            return user.id;
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
        const user = isEntity.user(item);
        if (user) {
          users.push(user);
          return user.id;
        }
      }

      return res.data;
    });
  }

  return { data, users };
}
