import { GithubService, Repository, StorageService } from '@/core/index.js';
import env from '@/helpers/env.js';
import githubClient from '@/helpers/github.js';
import { connect } from '@/knex/knex.js';
import { RelationalStorage } from '@/knex/storage.js';
import { Worker } from 'bullmq';
import { MultiBar, Presets } from 'cli-progress';
import { Option, program } from 'commander';
import consola from 'consola';
import { createQueue, createWorker } from './queue/queues.js';
import { RepositoryUpdater } from './repository.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('update')
    .addOption(new Option('-w, --workers <number>', 'Number of concurrent workers').argParser(Number).default(1))
    .helpOption('-h, --help', 'Display help for command')
    .action(async (opts: { workers: number }) => {
      consola.info('Initializing the storage service...');
      const service = new GithubService(githubClient);

      const progress = new MultiBar(
        {
          format: `{name} | {bar} | {percentage}% | {value}/{total}`,
          barCompleteChar: '\u2588',
          barIncompleteChar: '\u2591',
          hideCursor: true
        },
        Presets.shades_classic
      );

      const worker = reposUpdate(service, opts.workers, progress);

      await new Promise<void>((resolve) => {
        worker.on('closed', async () => resolve());
      });

      consola.success('Update process finished!');
    })
    .parseAsync(process.argv)
    .catch((error) => {
      consola.error(error);
      process.exit(1);
    })
    .finally(() => process.exit(0));
}

/**
 *
 */
function reposUpdate(service: GithubService, concurrency: number, progress: MultiBar): Worker {
  const queue = createQueue(Repository);

  const queueBar = progress.create(Infinity, 0, { name: '> repos' });

  setInterval(async () => {
    const count = await queue
      .getJobCounts()
      .then((totals) => Object.values(totals).reduce((acc, total) => acc + total, 0));

    queueBar.start(count, count - (await queue.count()) - (await queue.getActiveCount()), { name: '> repos' });
  }, 5000);

  return createWorker(
    Repository,
    async (job) => {
      const knex = await connect(env.DATABASE_URL, {
        schema: job.data.full_name.replace('/', '@').replace(/[^a-zA-Z0-9_]/g, '_'),
        migrate: true
      });

      const task = new RepositoryUpdater(job.data.full_name, {
        service: new StorageService(service, new RelationalStorage(knex), { valid_by: 1 }),
        parallel: true
      });

      const repoBar = progress.create(
        0,
        0,
        { repo: job.data.full_name },
        { format: `        | {bar} | {percentage}% | {value}/{total} | {repo}` }
      );

      task.subscribe({
        next: (notification) => {
          if (!notification.resource) {
            repoBar.increment(1);
            repoBar.setTotal(
              Object.values(notification.data._resources_counts || {}).reduce((acc, total) => acc + total, 1)
            );
          } else {
            if (!notification.done) {
              repoBar.increment(notification.data.length);
              job.updateProgress(repoBar.getProgress() * 100);
            }
          }
        },
        complete: () => {
          repoBar.stop();
          progress.remove(repoBar);
        }
      });

      return task
        .execute()
        .then(() => job.updateProgress(100))
        .then(() => queueBar.increment())
        .finally(() => queueBar.stop())
        .finally(() => progress.remove(queueBar))
        .finally(() => knex.destroy());
    },
    concurrency
  );
}
