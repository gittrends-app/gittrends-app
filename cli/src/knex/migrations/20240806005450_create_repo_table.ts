import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('repositories', (table) => {
    table.text('_id').primary();
    table.json('_resources_counts');

    table.integer('id').notNullable();
    table.text('node_id').notNullable();
    table.text('name').notNullable();
    table.text('full_name').notNullable();
    table.text('owner').notNullable();
    table.text('description');
    table.boolean('fork');
    table.text('homepage');
    table.text('language');
    table.integer('forks_count').notNullable();
    table.integer('stargazers_count').notNullable();
    table.integer('watchers_count').notNullable();
    table.integer('size').notNullable();
    table.text('default_branch').notNullable();
    table.integer('open_issues_count').notNullable();
    table.boolean('is_template');
    table.json('topics');
    table.boolean('has_issues').notNullable();
    table.boolean('has_projects').notNullable();
    table.boolean('has_wiki').notNullable();
    table.boolean('has_pages').notNullable();
    table.boolean('has_downloads');
    table.boolean('has_discussions').notNullable();
    table.boolean('archived').notNullable();
    table.boolean('disabled').notNullable();
    table.dateTime('pushed_at').notNullable();
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();
    table.boolean('allow_rebase_merge');
    table.json('template_repository');
    table.boolean('allow_squash_merge');
    table.boolean('allow_auto_merge');
    table.boolean('delete_branch_on_merge');
    table.boolean('allow_merge_commit');
    table.boolean('allow_update_branch');
    table.boolean('use_squash_pr_title_as_default');
    table.enum('squash_merge_commit_title', ['PR_TITLE', 'COMMIT_OR_PR_TITLE']);
    table.enum('squash_merge_commit_message', ['PR_BODY', 'COMMIT_MESSAGES', 'BLANK']);
    table.enum('merge_commit_title', ['PR_TITLE', 'MERGE_MESSAGE']);
    table.enum('merge_commit_message', ['PR_BODY', 'PR_TITLE', 'BLANK']);
    table.boolean('allow_forking');
    table.boolean('web_commit_signoff_required');
    table.integer('subscribers_count');
    table.integer('network_count');
    table.text('license');
    table.text('organization');
    table.json('parent');
    table.json('source');
    table.integer('forks').notNullable();
    table.text('master_branch');
    table.integer('open_issues').notNullable();
    table.integer('watchers').notNullable();
    table.text('code_of_conduct');

    table.index('id');
    table.index('full_name');

    table.foreign('owner').references('_id').inTable('users');
    table.foreign('organization').references('_id').inTable('users');
  });
}

/**
 *
 */
export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('repositories');
}
