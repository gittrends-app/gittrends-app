export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '@/core/(.*)\\.js$': '<rootDir>/../core/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }]
  },
  workerIdleMemoryLimit: '512MB',
  testMatch: ['**/*.spec.ts']
};
