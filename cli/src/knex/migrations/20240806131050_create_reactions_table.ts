import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('reactions', (table) => {
    table.string('_id').primary();
    table.string('_entityname').notNullable();
    table.string('_obtained_at').notNullable();
    table.string('_repository').notNullable();
    table.string('_reactable').notNullable();
    table.string('_reactable_id').notNullable();

    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.string('user').nullable();
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
