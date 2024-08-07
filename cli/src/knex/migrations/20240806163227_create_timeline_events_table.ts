import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('timeline_events', (table) => {
    table.string('_id').primary();
    table.string('_repository').notNullable();
    table.string('_issue').notNullable();

    table.string('event').notNullable();
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
