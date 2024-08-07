import { Repository, User } from '@/core/index.js';
import env from '@/helpers/env.js';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter.js';
import { ExpressAdapter } from '@bull-board/express';
import { Option, program } from 'commander';
import consola from 'consola';
import express from 'express';
import { createQueue } from './queues.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('bull-queue')
    .addOption(
      new Option('-p, --port <port>', 'Port to run the server').argParser(Number).default(env.QUEUE_BOARD_PORT)
    )
    .action((opts: { port: number }) => {
      const serverAdapter = new ExpressAdapter();
      serverAdapter.setBasePath('/');

      createBullBoard({
        queues: [new BullMQAdapter(createQueue(User)), new BullMQAdapter(createQueue(Repository))],
        serverAdapter: serverAdapter
      });

      const app = express();
      app.use('/', serverAdapter.getRouter());

      app.listen(opts.port, () => {
        consola.info(`Bull Board is running on http://localhost:${opts.port}`);
      });

      return new Promise<void>((resolve, reject) => {
        app.on('close', () => resolve());
        app.on('error', (err) => reject(err));
      });
    })
    .parseAsync(process.argv);
}
