/* eslint-disable jsdoc/require-jsdoc */
import chunk from 'lodash/chunk.js';
import { Actor } from '../../../entities/Actor.js';
import { GithubClient } from '../GithubClient.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { UserLookup } from '../graphql/lookups/UserLookup.js';
import { QueryBuilder } from '../graphql/QueryBuilder.js';

type Params = { factory: FragmentFactory; client: GithubClient; byLogin?: boolean };

async function users(idsArr: string[], params: Params): Promise<(Actor | null)[]> {
  if (idsArr.length === 0) return [];

  const result = await idsArr
    .reduce(
      (builder, id) => builder.add(new UserLookup({ id, byLogin: params.byLogin, factory: params.factory })),
      QueryBuilder.create(params.client)
    )
    .fetch()
    .then((result) => result.map((d) => d?.data as Actor | undefined))
    .catch((error) => {
      if ([502, 504].includes(error.status)) {
        if (idsArr.length === 1) return [null];
        else return Promise.all(chunk(idsArr, 1).map((chunk) => users(chunk, params))).then((data) => data.flat());
      }
      throw error;
    });

  return idsArr.map((_, index) => result[index] || null);
}

/**
 *  Retrieves users by their ID.
 */
export default async function (id: string, params: Params): Promise<Actor | null>;
export default async function (id: string[], params: Params): Promise<(Actor | null)[]>;
export default async function (id: string | string[], params: Params): Promise<any> {
  const ids = Array.isArray(id) ? id : [id];
  const resData = await Promise.all(chunk(ids, 10).map((c) => users(c, params))).then((data) => data.flat());
  return Array.isArray(id) ? resData : resData[0];
}
