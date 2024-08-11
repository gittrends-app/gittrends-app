import { Issue, Metadata, Release, Repository, Stargazer, Tag, User, Watcher } from '@/core/index.js';
import env from '@/helpers/env.js';
import { connect } from '@/knex/knex.js';
import { Command, Option, program } from 'commander';
import consola from 'consola';
import pick from 'lodash/pick.js';
import snakeCase from 'lodash/snakeCase.js';
import pluralize from 'pluralize';
import { createQueue } from './queue/queues.js';

const PRIORITIES = [
  { Entity: Tag, priority: 10 },
  { Entity: Release, priority: 10 },
  { Entity: Stargazer, priority: 10 },
  { Entity: Watcher, priority: 10 },
  { Entity: Issue, priority: 20 },
  { Entity: User, priority: 30 }
];

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
    .addOption(
      new Option('-r, --resource <resource...>', 'Resource to schedule')
        .choices(PRIORITIES.map((r) => r.Entity.name))
        .default(PRIORITIES.map((r) => r.Entity.name))
    )
    .addOption(new Option('-p, --priority <priority>', 'Priority of the resource').argParser(Number))
    .addOption(new Option('--repository <repository>', 'Repository to schedule'))
    .addOption(new Option('-f, --force', 'Force the schedule'))
    .action(async (opts: { resource: string[]; priority?: number; repository?: string; force?: boolean }) => {
      const resources = opts.resource
        .map((r) => PRIORITIES.find((p) => p.Entity.name === r)?.Entity)
        .filter((e) => e !== undefined);

      consola.info('Starting schedule...');
      const reposQueue = createQueue(Repository);

      consola.info('Connecting to database...');
      const conn = await connect(env.DATABASE_URL, { schema: 'public', migrate: true });

      const reposIt = conn<WithoutMethods<Repository>>(pluralize(snakeCase(Repository.name)))
        .where('full_name', 'ILIKE', `%${opts.repository || ''}%`)
        .select(['id', 'node_id', 'full_name'])
        .orderBy('updated_at', 'asc')
        .stream();

      for await (const repo of reposIt) {
        const meta = await conn<Metadata>(pluralize(snakeCase(Metadata.name))).where({
          entity_id: repo.node_id
        });

        consola.debug(`Scheduling repo ${repo.id} (${repo.full_name})...`);
        for (const EntityRef of resources) {
          if (opts.force) await reposQueue.remove(`${EntityRef.name}@${repo.full_name}`);
          await reposQueue.add(EntityRef.name, pick(repo, ['id', 'node_id', 'full_name']), {
            attempts: 10,
            priority:
              opts.priority ||
              (PRIORITIES.find((r) => r.Entity === EntityRef)?.priority || 50) +
                Math.floor(Math.random() * 10) +
                (meta.find((m) => m.entity === EntityRef.name)?.updated_at ? 1 : 0),
            jobId: `${EntityRef.name}@${repo.full_name}`,
            removeOnComplete: { age: 1000 * 60 * 60 * 24 }
          });
        }
      }

      consola.success('Schedule finished successfully!');
      await Promise.all([conn.destroy(), reposQueue.close()]);
    })
    .parse(process.argv);
}
