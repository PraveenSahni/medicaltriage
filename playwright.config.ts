import { defineConfig, devices } from "@playwright/test";

// A single shared backend server for every project below - `workers: 1`
// already serializes every test across all projects (no real concurrency
// between api-contract and any browser-journey project), so there is no
// need for a dedicated server per browser engine. This also matters for a
// real external constraint discovered while adding the Firefox/WebKit/mobile
// projects: DATABASE_URL points through a Cloud SQL Auth Proxy tunnel to a
// **shared production Cloud SQL instance** with only 25 max_connections,
// already serving the live demo/soc2 environments and a DR replica - running
// several separate backend servers (one per browser) competed for that same
// scarce, shared resource and starved it. One server, one connection pool.
const PORT = 18_080;

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
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    serviceWorkers: "block",
    viewport: { width: 1440, height: 1_000 }
  },
  webServer: {
    command: `npx tsx scripts/startE2eServer.ts --port=${PORT}`,
    url: `http://127.0.0.1:${PORT}/healthz`,
    reuseExistingServer: false,
    timeout: 60_000
  },
  projects: [
    {
      name: "api-contract",
      testMatch: /api-contract\.spec\.ts/
    },
    {
      name: "google-chrome",
      testMatch: /browser-journey\.spec\.ts/,
      // clipboard-read/write permission grants are a Chromium-specific
      // Playwright capability - Firefox/WebKit reject the permission name
      // outright (a real cross-engine incompatibility found while adding
      // those projects), so this stays scoped to the Chromium-based
      // projects only, not the shared top-level `use` block.
      use: {
        channel: "chrome",
        permissions: ["clipboard-read", "clipboard-write"]
      }
    },
    {
      name: "microsoft-edge",
      testMatch: /browser-journey\.spec\.ts/,
      use: {
        channel: "msedge",
        permissions: ["clipboard-read", "clipboard-write"]
      }
    },
    // Closes part of NFR-004 (Cross-Browser Compatibility) - Playwright ships
    // its own real Firefox and WebKit (Safari's engine) builds, so this is a
    // genuine second/third rendering-engine run, not just Chromium-based
    // browsers under different names (Chrome and Edge are both Chromium).
    {
      name: "mozilla-firefox",
      testMatch: /browser-journey\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] }
    },
    {
      name: "webkit-safari",
      testMatch: /browser-journey\.spec\.ts/,
      use: { ...devices["Desktop Safari"] }
    },
    // Closes part of NFR-001 (Mobile Responsiveness) - real mobile viewport +
    // touch + user-agent emulation via Playwright's device presets, run
    // against the same real app build as the desktop projects (not a
    // separate/fabricated mobile-only path).
    {
      name: "mobile-chrome-pixel5",
      testMatch: /browser-journey\.spec\.ts/,
      use: { ...devices["Pixel 5"], permissions: ["clipboard-read", "clipboard-write"] }
    },
    {
      name: "mobile-safari-iphone13",
      testMatch: /browser-journey\.spec\.ts/,
      use: { ...devices["iPhone 13"] }
    }
  ]
});
