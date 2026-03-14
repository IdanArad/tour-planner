import { test as setup, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

setup("authenticate", async ({ page }) => {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error(
      "Missing TEST_EMAIL or TEST_PASSWORD env vars. " +
      "Set them before running: export TEST_EMAIL=you@example.com TEST_PASSWORD=yourpass"
    );
  }

  await page.goto("/login");
  await page.getByLabel("Email").fill(TEST_EMAIL);
  await page.getByLabel("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();

  // Wait for redirect to dashboard — if this fails, credentials are wrong
  await expect(page).toHaveURL("/", { timeout: 15_000 });
  await expect(page.locator("text=Dashboard")).toBeVisible();

  // Save signed-in state
  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
