import { test, expect } from "@playwright/test";

test.describe("CRUD — Venues", () => {
  test("can create and delete a venue", async ({ page }) => {
    // Wait for network idle so the store finishes loading from Supabase
    await page.goto("/venues", { waitUntil: "networkidle" });
    await expect(page.getByRole("button", { name: "Add Venue" })).toBeVisible({ timeout: 10_000 });

    // Open form
    await page.getByRole("button", { name: "Add Venue" }).click();
    await expect(page.locator("text=Add a new venue")).toBeVisible();

    const venueName = "E2E Test Venue " + Date.now();

    // Fill form using placeholder selectors
    await page.getByPlaceholder("Venue name").fill(venueName);
    await page.getByPlaceholder("City").fill("Test City");
    await page.getByPlaceholder("Country").fill("Test Country");

    // Submit — click the button inside the dialog
    await page.locator("[role=dialog]").getByRole("button", { name: "Add Venue" }).click();

    // Modal should close, venue should appear in table
    await expect(page.locator(`text=${venueName}`)).toBeVisible({ timeout: 15_000 });

    // Clean up: find and delete the venue via edit
    const row = page.locator("tr", { hasText: venueName });
    await row.getByTitle("Edit venue").click();
    await expect(page.locator("text=Edit Venue")).toBeVisible();
    await page.getByRole("button", { name: "Delete" }).click();

    // Venue should disappear
    await expect(page.locator(`text=${venueName}`)).not.toBeVisible({ timeout: 5_000 });
  });
});

test.describe("CRUD — Shows", () => {
  test("can open new show form", async ({ page }) => {
    await page.goto("/shows");
    await expect(page.getByRole("button", { name: "New Show" })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "New Show" }).click();
    await expect(page.locator("text=Add a new show")).toBeVisible();

    // Should have venue select and date input
    await expect(page.locator("text=Venue *")).toBeVisible();
    await expect(page.locator("text=Date *")).toBeVisible();

    // Cancel
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});

test.describe("CRUD — Reachouts", () => {
  test("can open new reachout form", async ({ page }) => {
    await page.goto("/reachouts");
    await expect(page.getByRole("button", { name: "New Reachout" })).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "New Reachout" }).click();
    await expect(page.locator("text=Start a new venue outreach")).toBeVisible();

    // Should have venue select
    await expect(page.locator("text=Venue *")).toBeVisible();

    // Cancel
    await page.getByRole("button", { name: "Cancel" }).click();
  });
});
