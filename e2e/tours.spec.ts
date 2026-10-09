import { test, expect, type Page } from "@playwright/test";

// The header button and the empty-state CTA share the same label
function newTourButton(page: Page) {
  return page.getByRole("button", { name: "New Tour" }).first();
}

async function gotoTours(page: Page) {
  // Wait for network idle so the store finishes loading from Supabase
  await page.goto("/tours", { waitUntil: "networkidle" });
  await expect(newTourButton(page)).toBeVisible({ timeout: 10_000 });
}

test.describe("Tours", () => {
  test("page loads with table", async ({ page }) => {
    await gotoTours(page);
    await expect(page.locator("h1")).toContainText("Tours");
    for (const header of ["Tour", "Start", "End", "Shows", "Status"]) {
      await expect(page.getByRole("columnheader", { name: header, exact: true })).toBeVisible();
    }
  });

  test("is reachable from the sidebar", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.locator("nav").getByRole("link", { name: "Tours", exact: true }).click();
    await expect(page).toHaveURL("/tours", { timeout: 15_000 });
    await expect(page.locator("h1")).toContainText("Tours");
  });

  test("new tour form opens and cancels", async ({ page }) => {
    await gotoTours(page);
    await newTourButton(page).click();

    const dialog = page.locator("[role=dialog]");
    await expect(dialog.locator("text=Plan a new tour")).toBeVisible();
    await expect(dialog.getByPlaceholder("Tour name")).toBeVisible();
    await expect(dialog.locator("select")).toHaveValue("planning");

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
  });

  test("requires a tour name", async ({ page }) => {
    await gotoTours(page);
    await newTourButton(page).click();

    const dialog = page.locator("[role=dialog]");
    await dialog.getByRole("button", { name: "Create" }).click();

    await expect(dialog.locator("text=Tour name is required")).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
  });

  test("can create, edit and delete a tour", async ({ page }) => {
    await gotoTours(page);

    const tourName = "E2E Test Tour " + Date.now();
    const renamed = tourName + " (edited)";
    const dialog = page.locator("[role=dialog]");

    // Create
    await newTourButton(page).click();
    await dialog.getByPlaceholder("Tour name").fill(tourName);
    await dialog.locator("input[type=date]").nth(0).fill("2027-11-05");
    await dialog.locator("input[type=date]").nth(1).fill("2027-11-20");
    await dialog.getByPlaceholder("Any notes about this tour...").fill("Created by E2E test");
    await dialog.getByRole("button", { name: "Create" }).click();

    const row = page.locator("tr", { hasText: tourName });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row).toContainText("Nov 5, 2027");
    await expect(row).toContainText("Nov 20, 2027");
    await expect(row).toContainText("Planning");

    // Edit — form is pre-filled with the saved values
    await row.getByTitle("Edit tour").click();
    await expect(dialog.locator("text=Update tour details")).toBeVisible();
    await expect(dialog.getByPlaceholder("Tour name")).toHaveValue(tourName);
    await expect(dialog.locator("input[type=date]").nth(0)).toHaveValue("2027-11-05");

    await dialog.getByPlaceholder("Tour name").fill(renamed);
    await dialog.locator("select").selectOption("active");
    await dialog.getByRole("button", { name: "Update" }).click();

    const editedRow = page.locator("tr", { hasText: renamed });
    await expect(editedRow).toBeVisible({ timeout: 15_000 });
    await expect(editedRow).toContainText("Active");

    // Delete — cancelling the confirmation keeps the tour
    await editedRow.getByTitle("Edit tour").click();
    await dialog.first().getByRole("button", { name: "Delete" }).click();
    const confirm = dialog.last();
    await expect(confirm.locator("text=This action cannot be undone")).toBeVisible();
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(1);

    // Delete — confirming removes it
    await dialog.getByRole("button", { name: "Delete" }).click();
    await dialog.last().getByRole("button", { name: "Delete" }).click();
    await expect(page.locator(`text=${renamed}`)).not.toBeVisible({ timeout: 15_000 });

    // Still gone after a reload, i.e. really deleted in the database
    await gotoTours(page);
    await expect(page.locator(`text=${renamed}`)).not.toBeVisible();
  });
});
