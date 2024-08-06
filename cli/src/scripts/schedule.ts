import { Metadata, Repository, User } from '@/core/index.js';
import { AbstractTask } from '@/helpers/task.js';
import { knex } from '@/knex/knex.js';
import consola from 'consola';
import dayjs from 'dayjs';
import { Knex } from 'knex';
import pick from 'lodash/pick.js';
import pluralize from 'pluralize';
import { createQueue } from './queue/queues.js';

/**
 *  Task to schedule users for update.
 */
export class Schedule extends AbstractTask {
  constructor(private db: Knex) {
    super();
  }

  async execute(): Promise<void> {
    const usersQueue = createQueue(User);
    const reposQueue = createQueue(Repository);

    try {
      this.state = 'running';

      const usersIt = this.db<WithoutMethods<User>>(pluralize(User.prototype._entityname))
        .select(['id', 'node_id', 'login'])
        .whereNull('created_at')
        .orWhere('_obtained_at', '<', dayjs(new Date()).subtract(7, 'days').toDate())
        .orderBy('_obtained_at', 'asc')
        .stream();

      await usersQueue.drain(true);

      for await (const user of usersIt) {
        usersQueue.add(user.login, user, { jobId: `@${user.login}`, attempts: 3 });
      }

      const reposIt = this.db<WithoutMethods<Repository>>(pluralize(Repository.prototype._entityname))
        .select(['id', 'node_id', 'full_name'])
        .orderBy('_obtained_at', 'asc')
        .stream();

      for await (const repo of reposIt) {
        const meta = await this.db<Metadata>(pluralize(Metadata.prototype._entityname)).where({
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

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      throw error;
    } finally {
      await Promise.all([usersQueue.close(), reposQueue.close()]);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    consola.info('Scheduling...');
    const task = new Schedule(knex);
    await task.execute();

    consola.success('Schedule finished successfully!');
    await knex.destroy();
  })();
}
