// eslint.config.mjs
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';
import { FlatCompat } from '@eslint/eslintrc';
import { defineConfig } from 'eslint/config';

const compat = new FlatCompat({
  baseDirectory: import.meta.url ? new URL('.', import.meta.url).pathname : process.cwd(),
});

export default defineConfig([
  // top-level ignore patterns
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.swc/**',
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/test/**',
      '**/__tests__/**',
      '**/*.d.ts',
      '**/functions/**',
      '**/supabase/**'
    ],
  },

  // Bring in Next.js recommended config (via FlatCompat)
  ...compat.extends('next/core-web-vitals'),

  // TypeScript recommended rules (from typescript-eslint)
  ...tseslint.configs.recommended,

  // Base JS files (eslin t builtin recommendations)
  {
    files: ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
  },

  {
    ...pluginReact.configs.flat.recommended,
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      // keep JSX runtime convenience off — Next handles this
      'react/react-in-jsx-scope': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          ignoreRestSiblings: true,
        },
      ],
    },
  },

  // --- TEST FILES: provide Jest globals and any test-specific rules ---
  {
    files: [
      '**/*.test.{js,ts,jsx,tsx,mjs,cjs}',
      '**/*.spec.{js,ts,jsx,tsx,mjs,cjs}',
      'jest.setup.*',
    ],
    // Provide the standard jest globals so eslint's `no-undef` won't trip
    languageOptions: {
      globals: {
        ...globals.jest, // describe, it, expect, jest, beforeEach, etc.
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    // optional: you could add a plugin config for jest here if installed
    // e.g. plugin "eslint-plugin-jest" and its recommended config
  },

  // --- CONFIG FILES: relax rules that don't make sense for tooling files ---
  {
    files: ['prettier.config.js', '.prettierrc.js', 'tailwind.config.js', 'next.config.js'],
    rules: {
      // Prettier config (exporting anonymous default) — silence the import rule
      'import/no-anonymous-default-export': 'off',
    },
  },

  // --- GLOBAL RULE ADJUSTMENTS for TypeScript projects ---
  {
    // Turn off core no-undef: TypeScript (and @typescript-eslint) catches these at compile time.
    // This avoids false positives for type-only identifiers like `React` in `React.ReactNode`.
    rules: {
      'no-undef': 'off',
      // keep the TypeScript versions of the related rules enabled (they're in tseslint.configs.recommended)
    },
  },
]);
