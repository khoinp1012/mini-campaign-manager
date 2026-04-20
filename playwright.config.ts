import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use branded Chrome locally for Ubuntu 26.04 compatibility 
        // Use bundled chromium in CI for stability
        channel: process.env.CI ? undefined : 'chrome',
      },
    },
  ],
  webServer: [
    {
      command: 'yarn workspace @mini-campaign-manager/backend dev',
      port: 3001,
      reuseExistingServer: !process.env.CI,
      env: {
        E2E_SERVER: 'true',
      },
    },
    {
      command: 'yarn workspace @mini-campaign-manager/frontend dev',
      port: 5173,
      reuseExistingServer: !process.env.CI,
    },
  ],
});