import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('releases', (table) => {
    table.text('_id').primary();
    table.text('_repository').notNullable();

    table.integer('id').notNullable();
    table.text('node_id').notNullable();
    table.text('tag_name').notNullable();
    table.text('target_commitish').notNullable();
    table.text('name');
    table.text('body');
    table.boolean('draft').notNullable();
    table.boolean('prerelease').notNullable();
    table.datetime('created_at').notNullable();
    table.datetime('published_at');
    table.text('author').notNullable();
    table.json('assets');
    table.integer('mentions_count');
    table.json('reactions');

    table.index('_repository');

    table.foreign('_repository').references('_id').inTable('repositories');
    table.foreign('author').references('_id').inTable('users');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('releases');
}
