import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('metadata', (table) => {
    table.text('_id').primary();

    table.text('entity').notNullable();
    table.text('entity_id').notNullable();
    table.datetime('updated_at');

    table.json('payload');

    table.index(['entity', 'entity_id']);
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('metadata');
}
