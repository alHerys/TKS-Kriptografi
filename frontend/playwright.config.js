import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const python = fileURLToPath(new URL('../.venv/bin/python', import.meta.url));

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  expect: { timeout: 6000 },
  fullyParallel: true,
  workers: 3,
  use: {
    baseURL: 'http://127.0.0.1:8000',
    viewport: { width: 1366, height: 768 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'npm run build && "' +
      python +
      '" -B -m uvicorn web.app:app --app-dir .. --host 127.0.0.1 --port 8000',
    url: 'http://127.0.0.1:8000',
    reuseExistingServer: false,
    timeout: 60000,
  },
});
