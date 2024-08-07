import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('_id').primary();

    table.string('login').notNullable();
    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.string('gravatar_id');
    table.string('type').notNullable();
    table.boolean('site_admin').notNullable();
    table.string('name');
    table.string('company');
    table.string('blog');
    table.string('location');
    table.string('email');
    table.string('notification_email');
    table.boolean('hireable');
    table.string('bio');
    table.string('twitter_username');
    table.integer('public_repos');
    table.integer('public_gists');
    table.integer('followers');
    table.integer('following');
    table.dateTime('created_at');
    table.dateTime('updated_at');
    table.dateTime('suspended_at');
    table.integer('disk_usage');
    table.integer('collaborators');

    table.index('id');
    table.index('login');
    table.index('updated_at');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users');
}
