import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reactions', (table) => {
    table.text('_id').primary();
    table.text('_repository').notNullable();
    table.text('_reactable').notNullable();
    table.text('_reactable_id').notNullable();

    table.integer('id').notNullable();
    table.text('node_id').notNullable();
    table.text('user');
    table.enum('content', ['+1', '-1', 'laugh', 'confused', 'heart', 'hooray', 'rocket', 'eyes']).notNullable();
    table.datetime('created_at').notNullable();

    table.index('_repository');

    table.foreign('_repository').references('_id').inTable('repositories');
    table.foreign('user').references('_id').inTable('users');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('reactions');
}
