import { defineConfig } from "@playwright/test";

const API_PORT = 18_080;
const CHROME_PORT = 18_081;
const EDGE_PORT = 18_082;

function server(port: number) {
  return {
    command: `pnpm exec tsx scripts/startE2eServer.ts --port=${port}`,
    url: `http://127.0.0.1:${port}/healthz`,
    reuseExistingServer: false,
    timeout: 60_000
  };
}

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }]
  ],
  use: {
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    serviceWorkers: "block",
    permissions: ["clipboard-read", "clipboard-write"],
    viewport: { width: 1440, height: 1_000 }
  },
  webServer: [server(API_PORT), server(CHROME_PORT), server(EDGE_PORT)],
  projects: [
    {
      name: "api-contract",
      testMatch: /api-contract\.spec\.ts/,
      use: { baseURL: `http://127.0.0.1:${API_PORT}` }
    },
    {
      name: "google-chrome",
      testMatch: /browser-journey\.spec\.ts/,
      use: {
        baseURL: `http://127.0.0.1:${CHROME_PORT}`,
        channel: "chrome"
      }
    },
    {
      name: "microsoft-edge",
      testMatch: /browser-journey\.spec\.ts/,
      use: {
        baseURL: `http://127.0.0.1:${EDGE_PORT}`,
        channel: "msedge"
      }
    }
  ]
});
