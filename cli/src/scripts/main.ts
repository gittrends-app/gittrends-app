import { program } from 'commander';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .version('0.0.1')
    .command('search', 'Search for repositories', { executableFile: 'search' })
    .command('update', 'Process scheduled tasks', { executableFile: 'update' })
    .command('schedule', 'Schedule updating tasks', { executableFile: 'schedule' })
    .command('migrate', 'Run migrations', { executableFile: 'migrate' })
    .helpOption('-h, --help', 'Display this help message')
    .parse(process.argv);
}
