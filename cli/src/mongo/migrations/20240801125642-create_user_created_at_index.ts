import { User } from '@/core/index.js';
import snakeCase from 'lodash/snakeCase.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';

export const up = async (db: Db) => {
  await db.collection(pluralize(snakeCase(User.name))).createIndexes([{ key: { created_at: 1 }, unique: false }]);
};

export const down = async (db: Db) => {
  await db.collection(pluralize(snakeCase(User.name))).dropIndex('created_at');
};
