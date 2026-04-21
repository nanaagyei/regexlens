import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const isCI = !!process.env.CI;

const webServerEnv = {
  ...process.env,
  DATABASE_URL:
    process.env.DATABASE_URL || "postgresql://user:pass@localhost:5432/db",
  // Auth.js requires a secret outside `next dev`; CI runs `next build` + `next start`.
  AUTH_SECRET:
    process.env.AUTH_SECRET ||
    "playwright-e2e-auth-secret-placeholder-min-32-chars",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "iphone-12-smoke",
      use: { ...devices["iPhone 12"], browserName: "chromium" },
      grep: /@smoke/,
    },
  ],
  webServer: isCI
    ? {
        // Production server in CI avoids dev-only cross-origin chunk issues that keep
        // Monaco stuck on "Loading editor..." in headless runners.
        command: "npm run build && npm run start",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
        env: webServerEnv,
      }
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
        env: webServerEnv,
      },
});
