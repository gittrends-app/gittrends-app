import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('watchers', (table) => {
    table.string('_id').primary();
    table.string('_entityname').primary();
    table.string('_obtained_at').primary();
    table.string('_repository').notNullable();

    table.string('user').notNullable();

    table.index(['_repository']);
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('watchers');
}