import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.text('_id').primary();

    table.text('login').notNullable();
    table.integer('id').notNullable();
    table.text('node_id').notNullable();
    table.text('gravatar_id');
    table.text('type').notNullable();
    table.boolean('site_admin').notNullable();
    table.text('name');
    table.text('company');
    table.text('blog');
    table.text('location');
    table.text('email');
    table.text('notification_email');
    table.boolean('hireable');
    table.text('bio');
    table.text('twitter_username');
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
