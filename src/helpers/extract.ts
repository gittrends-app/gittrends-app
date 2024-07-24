import isPlainObject from 'lodash/isPlainObject.js';
import mapValues from 'lodash/mapValues.js';
import { Reaction, User } from '../entities/entity.js';
import isEntity from './is-entity.js';

/**
 *  Extracts users from an entity.
 */
export function extract<T = any>(entity: T): { data: T; users?: User[]; reactions?: Reaction[] } {
  let data: any = entity;
  const users: User[] = [];
  const reactions: Reaction[] = [];

  if (isPlainObject(entity)) {
    data = mapValues(entity as object, (value: any) => {
      const res = extract(value);
      users.push(...(res.users || []));
      reactions.push(...(res.reactions || []));

      return res.data;
    });

    const reaction = isEntity.reaction(data);
    if (reaction) {
      reactions.push(reaction);
      data = reaction._id;
    }

    const user = isEntity.user(data);
    if (user) {
      users.push(user);
      data = user._id;
    }
  }

  if (Array.isArray(entity)) {
    data = entity.map((item) => {
      const res = extract(item);
      users.push(...(res.users || []));
      reactions.push(...(res.reactions || []));

      return res.data;
    });
  }

  return {
    data,
    users: users.length ? users : undefined,
    reactions: reactions.length ? reactions : undefined
  };
}
