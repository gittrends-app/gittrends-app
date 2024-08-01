import { User } from '@/core/index.js';
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
  constructor(
    private db: Db,
    private days: number = 1
  ) {
    super();
  }

  async execute(): Promise<void> {
    const usersQueue = createQueue(User);

    try {
      this.state = 'running';

      const it = this.db.collection(pluralize(User.prototype._entityname)).find({
        $or: [
          { created_at: { $exists: false } },
          { _obtained_at: { $lte: dayjs(new Date()).subtract(this.days, 'days').toDate() } }
        ]
      });

      for await (const user of it) {
        consola.debug(`Scheduling user ${user.id} (${user.login})...`);
        await usersQueue.remove(`@${user.login}`);
        await usersQueue.add('user', pick(user, ['id', 'node_id', 'login']), { jobId: `@${user.login}`, attempts: 3 });
      }

      this.state = 'completed';
    } catch (error) {
      this.state = 'error';
      throw error;
    } finally {
      await usersQueue.close();
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    const db = client.db(env.MONGO_DB);

    consola.info('Connecting to the database...');
    await client.connect();

    consola.info('Scheduling users...');
    const task = new Schedule(db);
    await task.execute();

    consola.success('Users scheduled successfully!');
    await client.close();
  })();
}
