const config = {
  useNullAsDefault: true,
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['public'],
  migrations: {
    directory: './src/knex/migrations'
  }
};

export default config;
