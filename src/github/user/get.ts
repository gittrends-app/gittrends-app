import { MergeExclusive } from 'type-fest';
import { User, userSchema } from '../../entities/user.js';
import { request } from '../request.js';

/**
 * Get a user by id or login.
 *
 * @param params - The user parameters.
 */
export default async function get(
  params: MergeExclusive<{ id: number }, { login: string }>
): Promise<User | undefined> {
  const { id, login } = params;

  const [url, args] = id
    ? [`GET /user/:id` as const, { id: id }]
    : [`GET /users/:login` as const, { login: login }];

  return request({ url, schema: userSchema }, args as any);
}
