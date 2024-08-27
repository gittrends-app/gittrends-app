/* eslint-disable jsdoc/require-jsdoc */
import { User } from '../../entities/Entity.js';
import { GithubClient } from './client.js';
import users from './graphql/users.js';

type Params = { client: GithubClient; isLogin?: boolean };

/**
 *  Retrieves a user by their ID.
 */
export default async function (id: string, params: Params): Promise<User | null>;
export default async function (id: string[], params: Params): Promise<(User | null)[]>;
export default async function (id: string | string[], params: Params): Promise<any> {
  const idsArr = Array.isArray(id) ? id : [id];

  const response = await params.client.graphql<Record<string, any>>({
    query: `
    query users() {
      ${idsArr
        .map((id, index) =>
          params.isLogin
            ? `__${index}:repositoryOwner(login: "${id}") { ...ActorFrag }`
            : `__${index}:node(id: "${id}") { ...ActorFrag }`
        )
        .join('\n')}
    }

    ${users.fragment('ActorFrag')}
    `
  });

  const resData = idsArr
    .map((_, index) => users.parse(response[`__${index}`]))
    .map((data) => (data ? new User(data) : null));

  return Array.isArray(id) ? resData : resData[0];
}
