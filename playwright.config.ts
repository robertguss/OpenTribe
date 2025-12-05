import { defineConfig, devices } from '@playwright/test';

/**
 * OpenTribe E2E Test Configuration
 *
 * This configuration complements the existing Vitest + convex-test setup:
 * - Vitest: Convex function unit/integration tests (60% of coverage)
 * - Playwright: Critical E2E browser flows (10% of coverage)
 *
 * Run: pnpm run test:e2e
 * Debug: pnpm run test:e2e:ui
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  // Timeouts (per TEA knowledge base)
  timeout: 60 * 1000, // Test timeout: 60s
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15 * 1000, // Action timeout: 15s
    navigationTimeout: 30 * 1000, // Navigation timeout: 30s
  },

  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  projects: [
    // Auth setup project - runs once, saves session state
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Critical path tests (always run)
    {
      name: 'critical',
      testMatch: /.*\.critical\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Chromium tests (default)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },

    // Firefox tests (CI only)
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    // WebKit tests (CI only)
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },
  ],

  // Web server configuration
  webServer: {
    command: 'pnpm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes for dev server startup
  },
});
