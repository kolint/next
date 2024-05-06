import { nxE2EPreset } from "@nx/playwright/preset";
import { defineConfig, devices } from "@playwright/test";
import isCI from "is-ci";

const port = 51894;

// See https://playwright.dev/docs/test-configuration.
export default defineConfig({
  ...nxE2EPreset(import.meta.filename, { testDir: "./e2e" }),
  forbidOnly: isCI,
  use: {
    baseURL: `http://localhost:${port}`,
  },
  webServer: {
    command: `bun --bun vite e2e/frontend --port ${port}`,
    port: port,
    reuseExistingServer: !isCI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: [["html", { open: "never" }]],
});
