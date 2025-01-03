import mongo from '@/mongo/mongo.js';
import { Command, Option, program } from 'commander';
import consola from 'consola';
import pick from 'lodash/pick.js';
import { createQueue } from './shared/queues.js';
import { RepositoryUpdater } from './shared/RepositoryUpdater.js';

/**
 * CLI script to schedule updating tasks.
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('schedule')
    .addCommand(
      new Command('obliterate').action(async () => {
        const reposQueue = createQueue('repos');
        await reposQueue.obliterate({ force: true });
        return reposQueue.close();
      })
    )
    .addOption(new Option('-p, --priority <priority>', 'Priority of the resource').argParser(Number))
    .addOption(
      new Option('-r, --resource <resource...>', 'Resource to update')
        .choices(RepositoryUpdater.resources)
        .default(RepositoryUpdater.resources)
    )
    .addOption(new Option('--repository <repository>', 'Repository to schedule'))
    .addOption(new Option('-f, --force', 'Force the schedule'))
    .action(async (opts: { resource: string[]; priority?: number; repository?: string; force?: boolean }) => {
      consola.info('Starting schedule...');
      const reposQueue = createQueue('repos');

      consola.info('Connecting to database...');
      const reposIt = mongo
        .db('public')
        .collection('Repository')
        .find({ name_with_owner: new RegExp(opts.repository || '.*', 'i') })
        .sort({ updated_at: -1 })
        .project({ id: 1, name_with_owner: 1, updated_at: 1 });

      for await (const repo of reposIt) {
        consola.debug(`Scheduling repo ${repo.id} (${repo.name_with_owner})...`);
        const id = `github@${repo.name_with_owner}`;
        if (opts.force) await reposQueue.remove(id);
        await reposQueue.add(
          repo.name_with_owner,
          { ...pick(repo, ['id', 'name_with_owner']), resources: opts.resource },
          {
            jobId: id,
            attempts: 10,
            priority: opts.priority || (repo?.updated_at ? 10 : 5),
            removeOnComplete: { age: 1000 * 60 * 60 * 24 }
          }
        );
      }

      consola.success('Schedule finished successfully!');
      await Promise.all([mongo.close(), reposQueue.close()]);
    })
    .parse(process.argv);
}
