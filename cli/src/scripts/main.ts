import { program } from 'commander';
import { join } from 'path';

if (import.meta.url === `file://${process.argv[1]}`) {
  program
    .version('0.0.1')
    .command('search', 'Search for repositories', { executableFile: 'search' })
    .command('update', 'Update a given repository', { executableFile: join('./update', 'repository') })
    .helpOption('-h, --help', 'Display this help message')
    .parse(process.argv);
}
