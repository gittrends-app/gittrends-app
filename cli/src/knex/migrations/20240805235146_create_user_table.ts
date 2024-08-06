import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.string('_id').primary();
    table.string('_entityname').notNullable();
    table.datetime('_obtained_at').notNullable();

    table.string('login').notNullable();
    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.string('gravatar_id').nullable();
    table.string('type').notNullable();
    table.boolean('site_admin').notNullable();
    table.string('name').nullable();
    table.string('company').nullable();
    table.string('blog').nullable();
    table.string('location').nullable();
    table.string('email').nullable();
    table.string('notification_email').nullable();
    table.boolean('hireable').nullable();
    table.string('bio').nullable();
    table.string('twitter_username').nullable();
    table.integer('public_repos').nullable();
    table.integer('public_gists').nullable();
    table.integer('followers').nullable();
    table.integer('following').nullable();
    table.dateTime('created_at').nullable();
    table.dateTime('updated_at').nullable();
    table.dateTime('suspended_at').nullable();
    table.integer('disk_usage').nullable();
    table.integer('collaborators').nullable();

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
