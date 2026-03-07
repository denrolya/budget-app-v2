import js from '@eslint/js';

import prettier from 'eslint-config-prettier';

import importPlugin from 'eslint-plugin-import';
import perfectionist from 'eslint-plugin-perfectionist';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'src/components/ui', 'src/**/*.example.*'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      // 'plugin:import/recommended',
      // 'plugin:import/typescript',
      prettier,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        React: 'readonly',
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,

      // React
      react: reactPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,

      // Imports
      import: importPlugin,

      // Sorting/ordering
      perfectionist,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      /**
       * -------------------------
       * React / Hooks
       * -------------------------
       */
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',

      /**
       * -------------------------
       * TypeScript
       * -------------------------
       */
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
        },
      ],

      /**
       * -------------------------
       * Imports
       * -------------------------
       */
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          pathGroups: [
            {
              pattern: 'src/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/namespace': 'error',
      'import/default': 'error',
      'import/export': 'error',

      /**
       * -------------------------
       * JSX prop ordering
       * -------------------------
       *
       * NOTE:
       * ESLint cannot reliably enforce "literal props before expression props"
       * universally. This enforces:
       *  - shorthand boolean props first
       *  - stable ordering for the rest
       *  - "noisy" props last (className, handlers, content, etc.)
       */
      'perfectionist/sort-jsx-props': [
        'error',
        {
          type: 'alphabetical',
          order: 'asc',
          ignoreCase: true,
          specialCharacters: 'keep',

          // Keep existing manual grouping if you separate props with blank lines
          partitionByNewLine: true,

          // Put boolean shorthand props first, then normal props, multiline near the end,
          // and force "last-props" group at the very end.
          groups: ['shorthand-prop', 'prop', 'multiline-prop', 'last-prop'],

          // Force certain prop names to always be last (these are typically variables / noisy).
          // You can adjust this list without changing your day-to-day formatting habits.
          customGroups: [
            {
              groupName: 'last-prop',
              elementNamePattern:
                '^(key|ref|children|content|className|contentClassName|triggerClassName|.*ClassName|on[A-Z].*)$',
            },
          ],
        },
      ],

      /**
       * -------------------------
       * Style
       * -------------------------
       */
      'arrow-body-style': ['error', 'as-needed'],
      'object-curly-spacing': ['error', 'always'],
      quotes: ['error', 'single'],
      semi: ['error', 'always'],
      'prefer-arrow-callback': ['error'],
      'func-style': ['error', 'expression'],
    },
  },
);
