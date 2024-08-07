import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('tags', (table) => {
    table.string('_id').primary();
    table.string('_repository').notNullable();

    table.string('node_id').notNullable();
    table.string('name').notNullable();
    table.string('commit').notNullable();

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
