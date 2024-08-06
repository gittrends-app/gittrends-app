import type { Knex } from 'knex';

/**
 *
 */
export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('repositories', (table) => {
    table.string('_id').primary();
    table.string('_entityname').notNullable();
    table.datetime('_obtained_at').notNullable();
    table.json('_summary').nullable();

    table.integer('id').notNullable();
    table.string('node_id').notNullable();
    table.string('name').notNullable();
    table.string('full_name').notNullable();
    table.string('owner').notNullable();
    table.text('description').nullable();
    table.boolean('fork').nullable();
    table.string('homepage').nullable();
    table.string('language').nullable();
    table.integer('forks_count').notNullable();
    table.integer('stargazers_count').notNullable();
    table.integer('watchers_count').notNullable();
    table.integer('size').notNullable();
    table.string('default_branch').notNullable();
    table.integer('open_issues_count').notNullable();
    table.boolean('is_template').nullable();
    table.json('topics').nullable();
    table.boolean('has_issues').notNullable();
    table.boolean('has_projects').notNullable();
    table.boolean('has_wiki').notNullable();
    table.boolean('has_pages').notNullable();
    table.boolean('has_downloads').nullable();
    table.boolean('has_discussions').notNullable();
    table.boolean('archived').notNullable();
    table.boolean('disabled').notNullable();
    table.dateTime('pushed_at').notNullable();
    table.dateTime('created_at').notNullable();
    table.dateTime('updated_at').notNullable();
    table.boolean('allow_rebase_merge').nullable();
    table.json('template_repository').nullable();
    table.boolean('allow_squash_merge').nullable();
    table.boolean('allow_auto_merge').nullable();
    table.boolean('delete_branch_on_merge').nullable();
    table.boolean('allow_merge_commit').nullable();
    table.boolean('allow_update_branch').nullable();
    table.boolean('use_squash_pr_title_as_default').nullable();
    table.enum('squash_merge_commit_title', ['PR_TITLE', 'COMMIT_OR_PR_TITLE']).nullable();
    table.enum('squash_merge_commit_message', ['PR_BODY', 'COMMIT_MESSAGES', 'BLANK']).nullable();
    table.enum('merge_commit_title', ['PR_TITLE', 'MERGE_MESSAGE']).nullable();
    table.enum('merge_commit_message', ['PR_BODY', 'PR_TITLE', 'BLANK']).nullable();
    table.boolean('allow_forking').nullable();
    table.boolean('web_commit_signoff_required').nullable();
    table.integer('subscribers_count').nullable();
    table.integer('network_count').nullable();
    table.string('license').nullable();
    table.string('organization').nullable();
    table.json('parent').nullable();
    table.json('source').nullable();
    table.integer('forks').notNullable();
    table.string('master_branch').nullable();
    table.integer('open_issues').notNullable();
    table.integer('watchers').notNullable();
    table.string('code_of_conduct').nullable();

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
