import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('releases', (table) => {
    table.string('_id').primary();
    table.string('_entityname').primary();
    table.string('_obtained_at').primary();
    table.string('_repository').notNullable();

    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.string('tag_name').notNullable();
    table.string('target_commitish').notNullable();
    table.string('name').nullable();
    table.text('body').nullable();
    table.boolean('draft').notNullable();
    table.boolean('prerelease').notNullable();
    table.datetime('created_at').notNullable();
    table.datetime('published_at').nullable();
    table.string('author').notNullable();
    table.json('assets').nullable();
    table.integer('mentions_count').nullable();
    table.json('reactions').nullable();

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
