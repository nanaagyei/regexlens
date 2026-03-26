import { test, expect } from "@playwright/test";

test.describe("smoke", () => {
  test("home loads and links to app", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Stop guessing.*Start understanding/i,
      })
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: /Try it free/i }).first().click();
    await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  });

  test("app workspace shows pattern panel and Monaco editor", async ({ page }) => {
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Pattern", exact: true })
    ).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("pricing", () => {
  test("pricing page loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Simple pricing for developers/i,
      })
    ).toBeVisible({ timeout: 20_000 });
  });
});
