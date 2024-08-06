import { Metadata, Repository, User } from '@/core/index.js';
import { knex } from '@/knex/knex.js';
import { Command, program } from 'commander';
import consola from 'consola';
import dayjs from 'dayjs';
import pick from 'lodash/pick.js';
import pluralize from 'pluralize';
import { createQueue } from './queue/queues.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('schedule')
    .addCommand(
      new Command('obliterate').action(async () => {
        const usersQueue = createQueue(User);
        const reposQueue = createQueue(Repository);

        await Promise.all([usersQueue.obliterate({ force: true }), reposQueue.obliterate({ force: true })]).finally(
          () => Promise.all([knex.destroy(), usersQueue.close(), reposQueue.close()])
        );
      })
    )
    .action(async () => {
      consola.info('Starting schedule...');
      const usersQueue = createQueue(User);
      const reposQueue = createQueue(Repository);

      const usersIt = knex<WithoutMethods<User>>(pluralize(User.prototype._entityname))
        .select(['id', 'node_id', 'login'])
        .whereNull('created_at')
        .orWhere('_obtained_at', '<', dayjs(new Date()).subtract(7, 'days').toDate())
        .orderBy('_obtained_at', 'asc')
        .stream();

      await usersQueue.drain(true);

      for await (const user of usersIt) {
        usersQueue.add(user.login, user, { jobId: `@${user.login}`, attempts: 3 });
      }

      const reposIt = knex<WithoutMethods<Repository>>(pluralize(Repository.prototype._entityname))
        .select(['id', 'node_id', 'full_name'])
        .orderBy('_obtained_at', 'asc')
        .stream();

      for await (const repo of reposIt) {
        const meta = await knex<Metadata>(pluralize(Metadata.prototype._entityname)).where({
          entity_id: repo.node_id
        });

        consola.debug(`Scheduling repo ${repo.id} (${repo.full_name})...`);
        await reposQueue.remove(repo.full_name);
        await reposQueue.add(repo.full_name, pick(repo, ['id', 'node_id', 'full_name']), {
          jobId: repo.full_name,
          attempts: 3,
          priority: 1 + (meta.length + meta.reduce((acc, m) => acc + (m.updated_at ? 1 : 0), 0))
        });
      }

      consola.success('Schedule finished successfully!');
      await Promise.all([knex.destroy(), usersQueue.close(), reposQueue.close()]);
    })
    .parse(process.argv);
}
