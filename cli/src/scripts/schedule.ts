import { Metadata, Repository, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import { AbstractTask } from '@/helpers/task.js';
import client from '@/mongo/client.js';
import consola from 'consola';
import dayjs from 'dayjs';
import pick from 'lodash/pick.js';
import { Db } from 'mongodb';
import pluralize from 'pluralize';
import { createQueue } from './queue/queues.js';

/**
 *  Task to schedule users for update.
 */
export class Schedule extends AbstractTask {
  constructor(private db: Db) {
    super();
  }

  async execute(): Promise<void> {
    const usersQueue = createQueue(User);
    const reposQueue = createQueue(Repository);

    try {
      this.state = 'running';

      const usersIt = this.db
        .collection(pluralize(User.prototype._entityname))
        .find({
          $or: [
            { created_at: { $exists: false } },
            { _obtained_at: { $lte: dayjs(new Date()).subtract(7, 'days').toDate() } }
          ]
        })
        .project<{ id: number; node_id: string; login: string }>({ id: 1, node_id: 1, login: 1 })
        .sort({ _obtained_at: 1 });

      await usersQueue.drain(true);

      for await (const user of usersIt) {
        usersQueue.add(user.login, user, { jobId: `@${user.login}`, attempts: 3 });
      }

      const reposIt = this.db
        .collection(pluralize(Repository.prototype._entityname))
        .find({})
        .sort({ _obtained_at: 1 });

      for await (const repo of reposIt) {
        const meta = await this.db
          .collection(pluralize(Metadata.prototype._entityname))
          .find({ entity_id: repo._id })
          .toArray();

        consola.debug(`Scheduling repo ${repo.id} (${repo.full_name})...`);
        await reposQueue.remove(repo.full_name);
        await reposQueue.add(repo.full_name, pick(repo, ['id', 'node_id', 'full_name']), {
          jobId: repo.full_name,
          attempts: 3,
          priority: 1 + (meta.length + meta.reduce((acc, m) => (acc + m.updated_at ? 1 : 0), 0))
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
    const db = client.db(env.MONGO_DB);

    consola.info('Connecting to the database...');
    await client.connect();

    consola.info('Scheduling...');
    const task = new Schedule(db);
    await task.execute();

    consola.success('Schedule finished successfully!');
    await client.close();
  })();
}
