const { defineConfig, devices } = require('@playwright/test');
const baseline = process.env.BASELINE_URL;
const servers = [{
  command: 'node tools/preview-server.mjs --port 4173',
  url: 'http://127.0.0.1:4173',
  reuseExistingServer: !process.env.CI,
  cwd: require('node:path').resolve(__dirname, '..')
}];
if (baseline) servers.push({
  command: 'node tools/preview-server.mjs --port 4174',
  url: baseline,
  env: { SITE_DIR: '_baseline/dist' },
  cwd: require('node:path').resolve(__dirname, '..')
});
module.exports = defineConfig({
  testDir: './browser',
  timeout: 30000,
  expect: { timeout: 15000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  webServer: servers,
  projects: [
    { name: 'desktop-chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'touch-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'touch-webkit', use: { ...devices['iPhone 13'], browserName: 'webkit' } }
  ]
});
