import { Metadata } from '@/core/index.js';
import snakeCase from 'lodash/snakeCase.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';

export const up = async (db: Db) => {
  await db
    .collection(pluralize(snakeCase(Metadata.name)))
    .createIndexes([{ key: { entity: 1, entity_id: 1 }, name: 'entity_idx' }]);
};

export const down = async (db: Db) => {
  await db.collection(pluralize(snakeCase(Metadata.name))).dropIndex('entity_idx');
};
