import { test, expect } from "@playwright/test";

function encodeUrlSafe(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

test.describe("smoke", () => {
  test("@smoke home loads and links to app", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /Stop guessing.*Start understanding/i,
      })
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: /Open RegexLens/i }).first().click();
    await expect(page).toHaveURL(/\/app/, { timeout: 20_000 });
  });

  test("@smoke app workspace shows pattern panel and Monaco editor", async ({ page }) => {
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

test.describe("app access", () => {
  test("guests can open /app workbench", async ({ page }) => {
    await page.goto("/app");
    await expect(
      page.getByRole("heading", { name: "Pattern", exact: true })
    ).toBeVisible({ timeout: 20_000 });
  });
});

test.describe("workspace integration", () => {
  test("typing regex updates explanation panel", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    await editor.click();
    await page.keyboard.type("\\d+");

    await expect(page.getByText(/one or more/i)).toBeVisible({ timeout: 10_000 });
  });

  test("switching analysis tabs preserves workspace state", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    await editor.click();
    await page.keyboard.type("abc");

    await page.getByRole("button", { name: /More tabs/i }).click();
    await page.getByRole("menuitem", { name: /Structure/i }).click();
    await expect(page.getByText(/Pattern structure/i)).toBeVisible({
      timeout: 5_000,
    });

    await page.getByRole("tab", { name: /Explain|Exp/i }).click();

    await expect(page.getByText(/what this pattern does/i)).toBeVisible({
      timeout: 5_000,
    });
  });

  test("warning card click toggles lock state", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    await editor.click();
    await page.keyboard.type("example.com");

    await page.getByRole("tab", { name: /Warnings|Warn/i }).click();
    const warningCard = page.getByRole("button", { name: /Unescaped dot/i });

    await expect(warningCard).toHaveAttribute("aria-pressed", "false");
    await warningCard.click();
    await expect(warningCard).toHaveAttribute("aria-pressed", "true");
    await warningCard.click();
    await expect(warningCard).toHaveAttribute("aria-pressed", "false");
  });

  test("invalid regex remains resilient across warnings, failure, and diff tabs", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    await editor.click();
    await page.keyboard.type("[");
    await page.getByRole("textbox", { name: /Paste sample text/i }).fill("abc");

    await page.getByRole("tab", { name: /Warnings|Warn/i }).click();
    await expect(page.getByText(/fix the pattern to run safety checks/i)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("tab", { name: /Failure|Fail/i }).click();
    await expect(page.getByText(/no failure data/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /More tabs/i }).click();
    await page.getByRole("menuitem", { name: /Diff/i }).click();
    await page.getByLabel(/Compare against/i).fill("abc");

    await expect(
      page.getByText(/Structural diff unavailable — one or both patterns could not be parsed/i)
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByText(/Explanation diff unavailable — one or both patterns could not be parsed/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("long sample input shows sample-length status banner", async ({ page }) => {
    await page.goto("/app");
    const sample = page.getByRole("textbox", { name: /Paste sample text/i });
    await expect(sample).toBeVisible({ timeout: 20_000 });
    await sample.fill("z".repeat(50_001));
    await expect(
      page.getByRole("status").filter({ hasText: /50[, ]?000/ }),
    ).toBeVisible({ timeout: 15_000 });
  });

});

test.describe("URL state sharing", () => {
  test("@smoke shared URL with encoded state restores pattern, text, and comparison state", async ({ page }) => {
    const pattern = encodeUrlSafe("\\d+");
    const text = encodeUrlSafe("abc 123 def");
    const comparisonPattern = encodeUrlSafe("\\w+");
    const flags = "gi";
    const comparisonFlags = "m";

    await page.goto(
      `/app?p=${pattern}&f=${flags}&t=${text}&cp=${comparisonPattern}&cf=${comparisonFlags}`
    );

    await expect(
      page.getByRole("heading", { name: "Pattern", exact: true })
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      page.getByRole("textbox", { name: /Paste sample text/i })
    ).toHaveValue("abc 123 def", { timeout: 10_000 });

    await expect(page.getByText(/one or more/i)).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: /More tabs/i }).click();
    await page.getByRole("menuitem", { name: /Diff/i }).click();

    await expect(page.getByLabel(/Compare against/i)).toHaveValue("\\w+");
    await expect(page.getByTestId("comparison-flag-m")).toHaveAttribute("data-active", "true");
  });

  test("invalid URL params do not crash the app", async ({ page }) => {
    await page.goto("/app?p=!!!invalid-base64!!!&f=xyz&t=also-broken");

    await expect(
      page.getByRole("heading", { name: "Pattern", exact: true })
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("diff review", () => {
  test("diff tab renders behavior summary for pattern changes", async ({ page }) => {
    await page.goto("/app");

    const editor = page.locator(".monaco-editor").first();
    await expect(editor).toBeVisible({ timeout: 30_000 });

    await editor.click();
    await page.keyboard.type("foo");

    await page.getByRole("button", { name: /More tabs/i }).click();
    await page.getByRole("menuitem", { name: /Diff/i }).click();

    await page.getByLabel(/Compare against/i).fill("f.o");

    await expect(page.getByRole("heading", { name: /Review Summary/i })).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByText(/Wildcard removed — matching is more specific|Literal replaced with wildcard/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});

test.describe("template library", () => {
  test("selecting a template updates workspace", async ({ page }) => {
    await page.goto("/app");

    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /Examples/i }).first().click();

    await expect(
      page.getByRole("heading", { name: /Example Patterns/i })
    ).toBeVisible({ timeout: 5_000 });

    await page.getByText("Basic email").first().click();

    await expect(
      page.getByRole("heading", { name: /Example Patterns/i })
    ).not.toBeVisible({ timeout: 5_000 });

    await expect(page.getByText("test@example.com")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("template search filters results", async ({ page }) => {
    await page.goto("/app");

    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: /Examples/i }).first().click();
    await expect(
      page.getByRole("heading", { name: /Example Patterns/i })
    ).toBeVisible({ timeout: 5_000 });

    const searchInput = page.getByPlaceholder("Search patterns...");
    await searchInput.fill("email");

    await expect(page.getByText("Basic email")).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText("Brutal email validator")).toBeVisible({
      timeout: 3_000,
    });

    await expect(page.getByText("US phone number")).not.toBeVisible();
  });

});
