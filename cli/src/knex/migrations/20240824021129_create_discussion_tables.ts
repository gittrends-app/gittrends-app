import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  await Promise.all([
    knex.schema.createTable('discussions', (table) => {
      table.text('_id').primary();
      table.text('_repository').notNullable();

      table.integer('id').notNullable();
      table.text('node_id').notNullable();
      table.text('lock_reason');
      table.text('answer');
      table.timestamp('answer_chosen_at');
      table.text('answer_chosen_by');
      table.text('author');
      table.text('author_association').notNullable();
      table.text('body').notNullable();
      table.text('category');
      table.boolean('closed').notNullable();
      table.timestamp('closed_at');
      table.integer('comments_count');
      table.timestamp('created_at').notNullable();
      table.boolean('created_via_email').notNullable();
      table.text('editor');
      table.boolean('includes_created_edit').notNullable();
      table.boolean('is_awnsered');
      table.json('labels');
      table.timestamp('last_edited_at');
      table.boolean('locked').notNullable();
      table.integer('number').notNullable();
      table.timestamp('published_at');
      table.json('reactions');
      table.text('state_reason');
      table.text('title').notNullable();
      table.timestamp('updated_at');
      table.integer('upvote_count');

      table.foreign('_repository').references('_id').inTable('repositories');
      table.foreign('answer_chosen_by').references('_id').inTable('users');
      table.foreign('author').references('_id').inTable('users');
      table.foreign('editor').references('_id').inTable('users');
    }),
    knex.schema.createTable('discussion_comments', (table) => {
      table.text('_id').primary();
      table.text('_repository').notNullable();
      table.text('_discussion').notNullable();

      table.integer('id').notNullable();
      table.text('node_id').notNullable();
      table.text('author');
      table.text('author_association');
      table.text('body').notNullable();
      table.timestamp('created_at').notNullable();
      table.boolean('created_via_email').notNullable();
      table.timestamp('deleted_at');
      table.text('discussion');
      table.text('editor');
      table.boolean('includes_created_edit').notNullable();
      table.boolean('is_awnser').notNullable();
      table.boolean('is_minimized').notNullable();
      table.timestamp('last_edited_at');
      table.text('minimized_reason');
      table.timestamp('published_at');
      table.json('reactions');
      table.integer('replies_count').notNullable();
      table.text('reply_to');
      table.timestamp('updated_at');
      table.integer('upvote_count');

      table.foreign('_repository').references('_id').inTable('repositories');
      table.foreign('_discussion').references('_id').inTable('discussions');
      table.foreign('author').references('_id').inTable('users');
      table.foreign('editor').references('_id').inTable('users');
    })
  ]);
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  await Promise.all([knex.schema.dropTable('discussion_comments'), knex.schema.dropTable('discussions')]);
}
