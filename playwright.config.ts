import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for H&H Platform.
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './e2e',
  /* Maximum time one test can run for */
  timeout: 60 * 1000,
  expect: {
    timeout: 10 * 1000
  },
  /* Run tests sequentially to avoid local database or port race conditions */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env['CI'],
  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,
  /* Opt out of parallel tests on local/CI */
  workers: 1,
  /* Reporter to use */
  reporter: [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all the projects below */
  use: {
    baseURL: process.env['PLAYWRIGHT_TEST_BASE_URL'] || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ],

  /* Run local dev server before starting the tests */
  webServer: process.env['PLAYWRIGHT_TEST_BASE_URL']
    ? undefined
    : {
        command: 'pnpm --filter @hh/web dev',
        url: 'http://localhost:3000/api/health',
        reuseExistingServer: !process.env['CI'],
        timeout: 120 * 1000,
        env: {
          ENABLE_DEV_MOCKS: 'true'
        }
      }
});
