import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('stargazers', (table) => {
    table.text('_id').primary();
    table.text('_repository').notNullable();

    table.text('user').notNullable();
    table.datetime('starred_at').notNullable();

    table.index('_repository');

    table.foreign('_repository').references('_id').inTable('repositories');
    table.foreign('user').references('_id').inTable('users');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('stargazers');
}
