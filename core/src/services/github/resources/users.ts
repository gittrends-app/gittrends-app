/* eslint-disable jsdoc/require-jsdoc */
import { z } from 'zod';
import actor from '../../../entities/schemas/actor.js';
import { GithubClient } from '../client.js';
import { UserLookup } from '../graphql/lookups/UserLookup.js';
import { QueryBuilder } from '../graphql/QueryBuilder.js';

type Params = { client: GithubClient; byLogin?: boolean };

/**
 *  Retrieves users by their ID.
 */
export default async function (id: string, params: Params): Promise<z.infer<typeof actor> | null>;
export default async function (id: string[], params: Params): Promise<(z.infer<typeof actor> | null)[]>;
export default async function (id: string | string[], params: Params): Promise<any> {
  const idsArr = Array.isArray(id) ? id : [id];

  const result = await idsArr
    .reduce(
      (builder, id) => builder.add(new UserLookup(id, { byLogin: params.byLogin })),
      QueryBuilder.create(params.client)
    )
    .fetch();

  const resData = idsArr.map((_, index) => result[index]?.data || null);

  return Array.isArray(id) ? resData : resData[0];
}
