import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.ts', 'apps/*/vitest.config.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['packages/*/src/**/*.{ts,tsx}', 'apps/*/src/**/*.{ts,tsx}'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.{ts,js,mjs}',
        '**/test-setup.ts',
        '**/test-helpers.ts',
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/types.ts',
        '**/*.d.ts',
        'packages/db/src/seed.ts',
        'packages/db/src/migrate.ts',
        'apps/web/src/middleware.ts',
        'apps/web/src/components/ui/**',
        'apps/web/src/lib/observability/**',
        'apps/web/src/lib/sso/google.ts',
        'apps/web/src/lib/sso/zoho.ts',
        'apps/web/src/app/**/{page,layout,loading,error,not-found}.tsx'
      ],
      thresholds: {
        lines: 75,
        statements: 75,
        functions: 68,
        branches: 70,
        'packages/domain/src/checkout/**': {
          lines: 90,
          statements: 90,
          branches: 85,
          functions: 90
        },
        'packages/domain/src/money.ts': {
          lines: 80,
          statements: 80,
          branches: 70,
          functions: 75
        }
      }
    }
  }
});
