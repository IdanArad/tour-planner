import { test, expect } from "@playwright/test";

test.describe("Smoke tests — core pages load", () => {
  test("dashboard loads with stats", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Tour Planner");
    // Stats card header should be visible
    await expect(page.locator("p").filter({ hasText: /^Upcoming Shows$/ })).toBeVisible({ timeout: 10_000 });
  });

  test("shows page loads", async ({ page }) => {
    await page.goto("/shows");
    await expect(page.locator("h1")).toContainText("Shows");
    await expect(page.getByRole("button", { name: "New Show" })).toBeVisible();
  });

  test("venues page loads", async ({ page }) => {
    await page.goto("/venues");
    await expect(page.locator("h1")).toContainText("Venues");
    await expect(page.getByRole("button", { name: "Add Venue" })).toBeVisible();
  });

  test("reachouts page loads", async ({ page }) => {
    await page.goto("/reachouts");
    await expect(page.locator("h1")).toContainText("Reachouts");
    await expect(page.getByRole("button", { name: "New Reachout" })).toBeVisible();
  });

  test("discover page loads", async ({ page }) => {
    await page.goto("/discover");
    await expect(page.locator("h1")).toContainText("Discover");
  });

  test("settings page loads with form", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("h1")).toContainText("Settings");
    await expect(page.locator("text=Artist Profile")).toBeVisible({ timeout: 10_000 });
  });
});
