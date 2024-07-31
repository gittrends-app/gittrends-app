import { User } from '@/core/index.js';
import snakeCase from 'lodash/snakeCase.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';

export const up = async (db: Db) => {
  await db.collection(pluralize(snakeCase(User.name))).createIndexes([
    { key: { id: 1 }, unique: true },
    { key: { login: 1 }, unique: true }
  ]);
};

export const down = async (db: Db) => {
  await db.collection(pluralize(snakeCase(User.name))).dropIndex('id');
  await db.collection(pluralize(snakeCase(User.name))).dropIndex('login');
};
