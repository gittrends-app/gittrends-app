// In this file you can configure migrate-mongo

import { resolve } from 'path';

const config = {
  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: resolve('./src', 'mongo', 'migrations'),

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: 'changelog',

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: '.ts',

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determin
  // if the file should be run.  Requires that scripts are coded to be run multiple times.
  useFileHash: false,

  // Don't change this, unless you know what you're doing
  moduleSystem: 'esm'
};

export default config;
