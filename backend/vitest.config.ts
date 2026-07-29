import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    fileParallelism: false,
    testTimeout: 60000,
    hookTimeout: 120000,
    env: {
      NODE_ENV: 'test',
      SESSION_SECRET: 'test-session-secret-at-least-32-characters',
      CLIENT_ORIGIN: 'http://localhost:5173',
      APP_TIMEZONE: 'UTC',
    },
  },
});
