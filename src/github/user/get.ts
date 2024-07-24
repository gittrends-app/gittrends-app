import { MergeExclusive } from 'type-fest';
import { entities, User } from '../../entities/entities.js';
import { request } from '../_requests_/index.js';

/**
 * Get a user by id or login.
 *
 * @param params - The user parameters.
 */
export default async function get(
  params: MergeExclusive<{ id: number }, { login: string }>
): Promise<User | undefined> {
  const { id, login } = params;

  const [url, args] = id ? [`GET /user/:id` as const, { id: id }] : [`GET /users/:login` as const, { login: login }];

  return request({ url, parser: entities.user }, args as any);
}
