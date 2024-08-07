import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('timeline_events', (table) => {
    table.text('_id').primary();
    table.text('_repository').notNullable();
    table.text('_issue').notNullable();

    table.text('event').notNullable();
    table.json('payload').notNullable();

    table.index(['_repository', '_issue']);

    table.foreign('_repository').references('_id').inTable('repositories');
    table.foreign('_issue').references('_id').inTable('issues');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('timeline_events');
}
