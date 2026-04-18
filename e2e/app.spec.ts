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

    await page.getByRole("link", { name: /Open the app/i }).first().click();
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

test.describe("workspace integration", () => {
  test("typing regex updates explanation panel", async ({ page }) => {
    await page.goto("/app");

    // Wait for Monaco editor to load
    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    // Type a regex pattern into the Monaco editor
    await editor.click();
    await page.keyboard.type("\\d+");

    // Explanation panel should update with content about digits
    await expect(
      page.getByText(/one or more/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("switching analysis tabs preserves workspace state", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    // Type a pattern
    await editor.click();
    await page.keyboard.type("abc");

    // Open the "More" dropdown and click Structure
    await page.getByRole("button", { name: /More tabs/i }).click();
    await page.getByRole("menuitem", { name: /Structure/i }).click();
    await expect(page.getByText(/how it.*built/i)).toBeVisible({ timeout: 5_000 });

    // Click back to Explanation tab
    await page.getByRole("tab", { name: /Explain|Exp/i }).click();

    // Pattern should still be present - explanation content should still exist
    await expect(
      page.getByText(/what this pattern does/i)
    ).toBeVisible({ timeout: 5_000 });
  });

  test("invalid regex shows guided fallback in panels", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    // Type an invalid regex
    await editor.click();
    await page.keyboard.type("[");

    // Explanation panel should show an error state
    await expect(
      page.getByText(/fix the pattern/i)
    ).toBeVisible({ timeout: 10_000 });

    // Open the "More" dropdown and switch to Structure tab - should also show fallback
    await page.getByRole("button", { name: /More tabs/i }).click();
    await page.getByRole("menuitem", { name: /Structure/i }).click();
    await expect(
      page.getByText(/invalid pattern/i)
    ).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("URL state sharing", () => {
  test("shared URL with encoded state restores pattern and text", async ({ page }) => {
    // Encode a known pattern and text as URL params
    const pattern = btoa(encodeURIComponent("\\d+"));
    const text = btoa(encodeURIComponent("abc 123 def"));
    const flags = "gi";

    await page.goto(`/app?p=${pattern}&f=${flags}&t=${text}`);

    // Wait for workspace to load
    await expect(
      page.getByRole("heading", { name: "Pattern", exact: true })
    ).toBeVisible({ timeout: 20_000 });

    // The test text should appear in the textarea
    await expect(page.getByText("abc 123 def")).toBeVisible({ timeout: 10_000 });

    // Explanation panel should update based on the restored pattern
    await expect(
      page.getByText(/one or more/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("invalid URL params do not crash the app", async ({ page }) => {
    // Navigate with malformed base64 in params
    await page.goto("/app?p=!!!invalid-base64!!!&f=xyz&t=also-broken");

    // App should still load without crashing
    await expect(
      page.getByRole("heading", { name: "Pattern", exact: true })
    ).toBeVisible({ timeout: 20_000 });

    // Monaco editor should be visible (app not broken)
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("template library", () => {
  test("selecting a template updates workspace", async ({ page }) => {
    await page.goto("/app");

    // Wait for workspace to load
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });

    // Open template library dialog
    await page.getByRole("button", { name: /Examples/i }).first().click();

    // Dialog should appear with template library title
    await expect(
      page.getByRole("heading", { name: /Template Library/i })
    ).toBeVisible({ timeout: 5_000 });

    // Click the "Basic email" template
    await page.getByText("Basic email").first().click();

    // Dialog should close and workspace should update
    await expect(
      page.getByRole("heading", { name: /Template Library/i })
    ).not.toBeVisible({ timeout: 5_000 });

    // Test text from the email template should be visible
    await expect(page.getByText("test@example.com")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("template search filters results", async ({ page }) => {
    await page.goto("/app");

    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });

    // Open template library
    await page.getByRole("button", { name: /Examples/i }).first().click();
    await expect(
      page.getByRole("heading", { name: /Template Library/i })
    ).toBeVisible({ timeout: 5_000 });

    // Search for "email"
    const searchInput = page.getByPlaceholder("Search templates...");
    await searchInput.fill("email");

    // Should see email-related templates
    await expect(page.getByText("Basic email")).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Brutal email validator")).toBeVisible({
      timeout: 3_000,
    });

    // Non-email templates should not be visible
    await expect(page.getByText("US phone number")).not.toBeVisible();
  });
});

