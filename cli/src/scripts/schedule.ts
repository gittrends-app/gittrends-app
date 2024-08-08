import { Metadata, Repository } from '@/core/index.js';
import env from '@/helpers/env.js';
import { connect } from '@/knex/knex.js';
import { Command, program } from 'commander';
import consola from 'consola';
import pick from 'lodash/pick.js';
import snakeCase from 'lodash/snakeCase.js';
import pluralize from 'pluralize';
import { createQueue } from './queue/queues.js';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .name('schedule')
    .addCommand(
      new Command('obliterate').action(async () => {
        const reposQueue = createQueue(Repository);
        await reposQueue.obliterate({ force: true });
        return reposQueue.close();
      })
    )
    .action(async () => {
      consola.info('Starting schedule...');
      const reposQueue = createQueue(Repository);

      consola.info('Connecting to database...');
      const conn = await connect(env.DATABASE_URL, { schema: 'public', migrate: true });

      const reposIt = conn<WithoutMethods<Repository>>(pluralize(snakeCase(Repository.name)))
        .select(['id', 'node_id', 'full_name'])
        .orderBy('updated_at', 'asc')
        .stream();

      for await (const repo of reposIt) {
        const meta = await conn<Metadata>(pluralize(snakeCase(Metadata.name))).where({
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
      await Promise.all([conn.destroy(), reposQueue.close()]);
    })
    .parse(process.argv);
}
