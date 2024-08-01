import { User } from '@/core/index.js';
import snakeCase from 'lodash/snakeCase.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';

export const up = async (db: Db) => {
  await db.collection(pluralize(snakeCase(User.name))).createIndexes([
    { key: { id: 1 }, name: 'id_idx', unique: true },
    { key: { login: 1 }, name: 'login_idx', unique: true },
    { key: { created_at: 1, _obtained_at: 1 }, name: 'created_obtained_idx', unique: false }
  ]);
};

export const down = async (db: Db) => {
  await db.collection(pluralize(snakeCase(User.name))).dropIndex('id_idx');
  await db.collection(pluralize(snakeCase(User.name))).dropIndex('login_idx');
  await db.collection(pluralize(snakeCase(User.name))).dropIndex('created_obtained_idx');
};
