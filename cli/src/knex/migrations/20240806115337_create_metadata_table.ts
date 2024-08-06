import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('metadata', (table) => {
    table.string('_id').primary();
    table.string('_entityname').notNullable();
    table.datetime('_obtained_at').notNullable();

    table.string('entity').notNullable();
    table.string('entity_id').notNullable();
    table.datetime('updated_at').nullable();

    table.json('payload').nullable();

    table.index(['entity', 'entity_id']);
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('metadata');
}
