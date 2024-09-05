/* eslint-disable jsdoc/require-jsdoc */
import chunk from 'lodash/chunk.js';
import { Actor } from '../../../entities/Actor.js';
import { GithubClient } from '../client.js';
import { FragmentFactory } from '../graphql/fragments/Fragment.js';
import { UserLookup } from '../graphql/lookups/UserLookup.js';
import { QueryBuilder } from '../graphql/QueryBuilder.js';

type Params = { factory: FragmentFactory; client: GithubClient; byLogin?: boolean };

async function users(idsArr: string[], params: Params): Promise<(Actor | null)[]> {
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
        else
          return Promise.all(chunk(idsArr, Math.ceil(idsArr.length / 2)).map((chunk) => users(chunk, params))).then(
            (data) => data.flat()
          );
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
  const idsArr = Array.isArray(id) ? id : [id];

  const resData = await Promise.all(chunk(idsArr, 50).map((chunk) => users(chunk, params))).then((data) => data.flat());

  return Array.isArray(id) ? resData : resData[0];
}
