import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('issues', (table) => {
    table.string('_id').primary();
    table.string('_entityname').notNullable();
    table.string('_obtained_at').notNullable();
    table.string('_repository').notNullable();

    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.integer('number').notNullable();
    table.enum('state', ['open', 'closed']).notNullable();
    table.enum('state_reason', ['completed', 'reopened', 'not_planned']).nullable();
    table.string('title').notNullable();
    table.text('body').nullable();
    table.string('user').nullable();
    table.json('labels').nullable();
    table.string('assignee').nullable();
    table.json('assignees').nullable();
    table.string('milestone').nullable();
    table.boolean('locked').notNullable();
    table.string('active_lock_reason').nullable();
    table.integer('comments').notNullable();
    table.json('pull_request').nullable();
    table.datetime('closed_at').nullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    table.boolean('draft').nullable();
    table.string('closed_by').nullable();
    table.json('performed_via_github_app').nullable();
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
    table.json('reactions').nullable();

    // PR specific fields
    table.datetime('merged_at').nullable();
    table.string('merge_commit_sha').nullable();
    table.json('requested_reviewers').nullable();
    table.json('requested_teams').nullable();
    table.json('head').nullable();
    table.json('base').nullable();
    table.json('auto_merge').nullable();
    table.boolean('merged').nullable();
    table.boolean('mergeable').nullable();
    table.boolean('rebaseable').nullable();
    table.string('mergeable_state').nullable();
    table.string('merged_by').nullable();
    table.integer('review_comments').nullable();
    table.boolean('maintainer_can_modify').nullable();
    table.integer('commits').nullable();
    table.integer('additions').nullable();
    table.integer('deletions').nullable();
    table.integer('changed_files').nullable();

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
