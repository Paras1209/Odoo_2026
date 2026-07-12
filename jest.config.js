module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/*.config.js',
    '!**/*.seed.js',
    '!**/*.json'
  ],
  testTimeout: 10000
};