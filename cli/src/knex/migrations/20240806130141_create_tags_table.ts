import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tags', (table) => {
    table.text('_id').primary();
    table.text('_repository').notNullable();

    table.text('node_id').notNullable();
    table.text('name').notNullable();
    table.text('commit').notNullable();

    table.index('_repository');

    table.foreign('_repository').references('_id').inTable('repositories');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('tags');
}
