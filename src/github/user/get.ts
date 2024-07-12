import { OctokitResponse } from '@octokit/types';
import { MergeExclusive } from 'type-fest';
import { User, userSchema } from '../../entities/user.js';
import { clients } from '../clients.js';

/**
 * Get a user by id or login.
 *
 * @param params - The user parameters.
 */
export default async function get(
  params: MergeExclusive<{ id: number }, { login: string }>
): Promise<User | undefined> {
  const [url, args] = params.id
    ? [`/user/:id`, { id: params.id }]
    : [`/users/:login`, { login: params.login }];

  return clients.rest
    .request(url, args)
    .then((response: OctokitResponse<typeof clients.rest.users.getByUsername>) => {
      if (response.status !== 200) throw new Error(`Failed to get user: ${response.status}`);
      return userSchema.parse(response.data);
    })
    .catch((error) => {
      if (error.response.status === 404) return undefined;
      else throw error;
    });
}
