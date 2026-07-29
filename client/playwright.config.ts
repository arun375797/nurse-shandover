import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm run e2e:serve -w @bedsiderelay/server',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        CLIENT_ORIGIN: 'http://localhost:5173',
        SESSION_SECRET: 'test-session-secret-at-least-32-characters',
        PORT: '4000',
      },
    },
    {
      command:
        'npm run build -w @bedsiderelay/client && npm run preview -w @bedsiderelay/client -- --host localhost --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 180000,
    },
  ],
});
