import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('commits', (table) => {
    table.text('_id').primary();
    table.text('_repository').notNullable();

    table.text('sha').notNullable();
    table.text('node_id').notNullable();
    table.json('commit').notNullable();
    table.text('author');
    table.text('committer');
    table.json('parents');
    table.json('stats');
    table.json('files');

    table.foreign('_repository').references('_id').inTable('repositories');
    table.foreign('author').references('_id').inTable('users');
    table.foreign('committer').references('_id').inTable('users');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('commits');
}
