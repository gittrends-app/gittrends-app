import { MergeExclusive } from 'type-fest';
import { User } from '../../entities/Entity.js';
import { request } from '../_requests_/index.js';

/**
 * Get a user by id or login.
 */
export default async function get(
  params: MergeExclusive<{ id: number }, { login: string }>
): Promise<User | undefined> {
  const { id, login } = params;

  const [url, args] = id ? [`GET /user/:id` as const, { id: id }] : [`GET /users/:login` as const, { login: login }];

  return request({ url, Entity: User }, args as any);
}
