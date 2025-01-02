import { program } from 'commander';

import packageJson from '../../package.json' with { type: 'json' };

/**
 * CLI script
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .version(packageJson.version || '0.0.0')
    .command('add', 'Add repositories', { executableFile: 'add' })
    .command('update', 'Process scheduled tasks', { executableFile: 'update' })
    .command('update:repo', 'Update a given repository', { executableFile: 'repository' })
    .command('schedule', 'Schedule updating tasks', { executableFile: 'schedule' })
    .helpOption('-h, --help', 'Display this help message')
    .parse(process.argv);
}
