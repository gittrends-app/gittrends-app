import { Entity, User } from '@/core/entities/Entity.js';
import cloneDeep from 'lodash/cloneDeep.js';
import forIn from 'lodash/forIn.js';
import isPlainObject from 'lodash/isPlainObject.js';

/**
 *  Extracts users from an entity.
 */
export function extract<T = any>(entity: T): { data: T; users?: User[] } {
  let data: any = cloneDeep(entity);

  const users: User[] = [];

  if (isPlainObject(entity) || entity instanceof Entity) {
    forIn(entity as object, (value: any, key: string) => {
      const res = extract(value);
      users.push(...(res.users || []));

      data[key] = res.data;
    });

    if (User.validate(data)) {
      const user = new User(data);
      users.push(user);
      data = user._id;
    }
  }

  if (Array.isArray(entity)) {
    data = entity.map((item) => {
      const res = extract(item);
      users.push(...(res.users || []));

      return res.data;
    });
  }

  return {
    data,
    users: users.length ? users : undefined
  };
}
