import { defineConfig, devices } from "@playwright/test";

// Ad hoc config for running the existing e2e suite against an already-
// deployed live environment (no local server, no webServer block) - used
// for a one-off cross-environment comparison between triaged.irisstar.tech
// and triagedsoc2.irisstar.tech. Not part of the standard CI/local dev
// path (see playwright.config.ts for that) - REMOTE_BASE_URL must be set
// explicitly to use this config.
const baseURL = process.env.REMOTE_BASE_URL;
if (!baseURL) {
  throw new Error("REMOTE_BASE_URL must be set to use playwright.remote.config.ts");
}

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "test-results-remote",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: {
    timeout: 15_000
  },
  reporter: [
    ["list"],
    ["json", { outputFile: `test-results-remote/results-${process.env.REMOTE_LABEL ?? "run"}.json` }]
  ],
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
    serviceWorkers: "block",
    viewport: { width: 1440, height: 1_000 }
  },
  projects: [
    {
      name: "api-contract",
      testMatch: /api-contract\.spec\.ts/
    },
    {
      name: "google-chrome",
      testMatch: /(browser-journey|cockpitResponsive)\.spec\.ts/,
      use: {
        channel: "chrome",
        permissions: ["clipboard-read", "clipboard-write"]
      }
    }
  ]
});
