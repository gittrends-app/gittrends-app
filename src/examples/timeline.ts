import consola from 'consola';
import treeify from 'treeify';
import { TimelineBaseEvent } from '../entities/events.js';
import { github } from '../github/index.js';

(async () => {
  consola.info('Getting issues of octokit/rest.js...');
  const repo = await github.repos.get({ owner: 'octokit', name: 'rest.js' });
  if (!repo) throw new Error('Repository octokit/rest.js not found.');

  const issuesIt = github.repos.issues({ repo: repo.id });

  for await (const { data } of issuesIt) {
    for (const issue of data) {
      const eventsIt = github.repos.timeline({ repo: repo.id, issue: issue.number });
      consola.info('Found timeline events:');
      for await (const { data } of eventsIt) {
        for (const event of data) {
          consola.info(
            `${event.event} at ${(event as unknown as TimelineBaseEvent).created_at?.toISOString()}`
          );
          // eslint-disable-next-line no-console
          treeify.asLines(event as any, true, console.log);
        }
      }
    }
  }

  consola.success('Issues retrieved.');
})().catch((err) => {
  consola.error(err);
  process.exit(1);
});
