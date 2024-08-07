import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('issues', (table) => {
    table.string('_id').primary();
    table.string('_repository').notNullable();
    table.enum('_type', ['Issue', 'PullRequest']).notNullable();

    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.integer('number').notNullable();
    table.enum('state', ['open', 'closed']).notNullable();
    table.enum('state_reason', ['completed', 'reopened', 'not_planned']);
    table.string('title').notNullable();
    table.text('body');
    table.string('user');
    table.json('labels');
    table.string('assignee');
    table.json('assignees');
    table.string('milestone');
    table.boolean('locked').notNullable();
    table.string('active_lock_reason');
    table.integer('comments').notNullable();
    table.json('pull_request');
    table.datetime('closed_at');
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    table.boolean('draft');
    table.string('closed_by');
    table.json('performed_via_github_app');
    table
      .enum('author_association', [
        'OWNER',
        'MEMBER',
        'CONTRIBUTOR',
        'COLLABORATOR',
        'FIRST_TIME_CONTRIBUTOR',
        'FIRST_TIMER',
        'NONE'
      ])
      .notNullable();
    table.json('reactions');

    // PR specific fields
    table.datetime('merged_at');
    table.string('merge_commit_sha');
    table.json('requested_reviewers');
    table.json('requested_teams');
    table.json('head');
    table.json('base');
    table.json('auto_merge');
    table.boolean('merged');
    table.boolean('mergeable');
    table.boolean('rebaseable');
    table.string('mergeable_state');
    table.string('merged_by');
    table.integer('review_comments');
    table.boolean('maintainer_can_modify');
    table.integer('commits');
    table.integer('additions');
    table.integer('deletions');
    table.integer('changed_files');

    table.index('_repository');

    table.foreign('_repository').references('_id').inTable('repositories');
    table.foreign('user').references('_id').inTable('users');
    table.foreign('assignee').references('_id').inTable('users');
    table.foreign('closed_by').references('_id').inTable('users');
    table.foreign('merged_by').references('_id').inTable('users');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('issues');
}
