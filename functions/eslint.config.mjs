// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default tseslint.config(
  // Global ignores
  {
    ignores: ['lib/**/*', 'generated/**/*', 'prettier.config.js', 'eslint.config.mjs'],
  },

  // Base configuration for all files
  eslint.configs.recommended,

  // TypeScript specific configurations
  ...tseslint.configs.recommended,

  // Import plugin configuration
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // These are from the recommended import plugin configs
      ...importPlugin.configs.errors.rules,
      ...importPlugin.configs.warnings.rules,
      ...importPlugin.configs.typescript.rules,
      'import/no-unresolved': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },

  // Project-specific rules and settings
  {
    languageOptions: {
      parserOptions: {
        project: ['tsconfig.json', 'tsconfig.dev.json'],
        sourceType: 'module',
      },
    },
    rules: {
      quotes: ['error', 'single'],
      indent: ['error', 2],

      'max-len': ['error', { code: 120 }],
      'object-curly-spacing': ['error', 'always'],
    },
  },
);
