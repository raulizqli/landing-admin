/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testTimeout: 20000,
  roots: [
    '<rootDir>/packages/landing-core/src',
    '<rootDir>/landing-admin/src',
    '<rootDir>/landing-template/src',
  ],
  testMatch: ['**/*.test.js'],
  setupFiles: ['<rootDir>/jest.setup.cjs'],
  resolver: '<rootDir>/jest.resolver.cjs',
  transform: {
    '^.+\\.jsx?$': '<rootDir>/jest-import-meta-transform.cjs',
  },
  moduleNameMapper: {
    '^vitest$': '<rootDir>/jest-vitest-compat.mjs',
    '^@raulizqli/landing-core$': '<rootDir>/packages/landing-core/src/index.js',
    '^@raulizqli/landing-core/(.*)$': '<rootDir>/packages/landing-core/src/$1',
  },
  collectCoverageFrom: [
    'packages/landing-core/src/**/*.js',
    'landing-admin/src/**/*.js',
    'landing-template/src/**/*.js',
    '!**/*.test.{js,mjs}',
    '!**/components/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov'],
};
