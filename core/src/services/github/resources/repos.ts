/* eslint-disable jsdoc/require-jsdoc */
import { z } from 'zod';
import repository from '../../../entities/schemas/repository.js';
import { GithubClient } from '../client.js';
import { RepositoryLookup } from '../graphql/lookups/RepositoryLookup.js';
import { QueryBuilder } from '../graphql/QueryBuilder.js';

type Params = { client: GithubClient; byName?: boolean };

/**
 *  Retrieves repositories by their ID.
 */
export default async function (id: string, params: Params): Promise<z.infer<typeof repository> | null>;
export default async function (id: string[], params: Params): Promise<(z.infer<typeof repository> | null)[]>;
export default async function (id: string | string[], params: Params): Promise<any> {
  const idsArr = Array.isArray(id) ? id : [id];

  const result = await idsArr
    .reduce(
      (builder, id) => builder.add(new RepositoryLookup(id, { byName: params.byName })),
      QueryBuilder.create(params.client)
    )
    .fetch();

  const resData = idsArr.map((_, index) => result[index]?.data || null);

  return Array.isArray(id) ? resData : resData[0];
}