import { test, expect } from "@playwright/test";

test.describe("Settings — Artist profile editing", () => {
  test("can save artist profile without errors", async ({ page }) => {
    await page.goto("/settings");

    // Wait for form to load (not loading spinner)
    await expect(page.locator("text=Artist Profile")).toBeVisible({ timeout: 10_000 });

    // Fill in artist name if empty (new artist case)
    const nameInput = page.locator("#artist-name");
    const currentName = await nameInput.inputValue();
    if (!currentName) {
      await nameInput.fill("Test Artist");
    }

    // Click save
    await page.getByRole("button", { name: /Save Changes|Create Profile/ }).click();

    // Should see success message (not an error about UUID)
    await expect(page.locator("text=Changes saved").or(page.locator("text=Profile created"))).toBeVisible({ timeout: 10_000 });

    // Should NOT see any UUID error
    await expect(page.locator("text=invalid input syntax")).not.toBeVisible();
  });

  test("can update genre and save", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=Artist Profile")).toBeVisible({ timeout: 10_000 });

    // Ensure artist name is filled
    const nameInput = page.locator("#artist-name");
    const currentName = await nameInput.inputValue();
    if (!currentName) {
      await nameInput.fill("Test Artist");
    }

    const genreInput = page.locator("#genre");
    await genreInput.fill("Test Genre " + Date.now());
    await page.getByRole("button", { name: /Save Changes|Create Profile/ }).click();

    await expect(page.locator("text=Changes saved").or(page.locator("text=Profile created"))).toBeVisible({ timeout: 10_000 });
  });

  test("shows validation error if name is empty", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator("text=Artist Profile")).toBeVisible({ timeout: 10_000 });

    const nameInput = page.locator("#artist-name");
    await nameInput.clear();
    await page.getByRole("button", { name: /Save Changes|Create Profile/ }).click();

    await expect(page.locator("text=Artist name is required")).toBeVisible();
  });
});
