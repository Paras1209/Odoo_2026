import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';

const compat = new FlatCompat();

export default [
  js.configs.eslintRecommended,
  ...compat.extends('eslint:recommended'),
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'build/**',
      '.env',
      '.env.*',
      'npm-debug.log*',
      'yarn-debug.log*',
      'yarn-error.log*',
      'pnpm-debug.log*',
      'lerna-debug.log*',
      '.nyc_output',
      '.DS_Store'
    ]
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs'
    }
  }
];
