import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/coverage/**', '**/*.d.ts']
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      '@typescript-eslint/no-explicit-any': 'error',

      // ── Strict Import Ordering ──────────────────────────────────────
      // Group 1a: External package value imports  (alphabetical)
      // Group 1b: External package type imports   (alphabetical)
      //           ── blank line ──
      // Group 2a: Workspace (@hh/*) value imports (alphabetical)
      // Group 2b: Workspace (@hh/*) type imports  (alphabetical)
      //           ── blank line ──
      // Group 3a: Local (relative) value imports  (alphabetical)
      // Group 3b: Local (relative) type imports   (alphabetical)
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // 1a — External / third-party value imports
            ['^node:', '^[a-z]', '^@(?!hh/)'],
            // 1b — External / third-party type imports
            ['^node:.*\\u0000$', '^[a-z].*\\u0000$', '^@(?!hh/).*\\u0000$'],
            // 2a — Workspace value imports
            ['^@hh/'],
            // 2b — Workspace type imports
            ['^@hh/.*\\u0000$'],
            // 3a — Local / relative value imports
            ['^\\.'],
            // 3b — Local / relative type imports
            ['^\\..*\\u0000$']
          ]
        }
      ],
      'simple-import-sort/exports': 'error'
    }
  }
);
