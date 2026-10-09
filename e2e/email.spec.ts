import { test, expect, type Page } from "@playwright/test";
import { startFakeSmtp, REJECT_DOMAIN, type FakeSmtp } from "./helpers/fake-smtp";

// Only runs when the app under test sends to the local SMTP sink
// (scripts/e2e-local.sh sets this up), so it can never send real mail.
const usesFakeSmtp = process.env.SMTP_HOST === "127.0.0.1" && !process.env.SMTP_USER;

// Seeded reachout with a single row in the table (contact: tom@paradiserock.com)
const VENUE = "Paradise Rock Club";

async function openComposer(page: Page) {
  // Wait for network idle so the store finishes loading from Supabase
  await page.goto("/reachouts", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: VENUE, exact: true }).click();

  const dialog = page.locator("[role=dialog]");
  await dialog.getByRole("button", { name: /^Send (Email|Follow-up)$/ }).click();
  await expect(dialog.locator("text=Compose Email")).toBeVisible();
  return dialog;
}

test.describe("Outreach email over SMTP", () => {
  test.skip(!usesFakeSmtp, "Needs the local SMTP sink — run via `npm run test:local`");

  let smtp: FakeSmtp;

  test.beforeAll(async () => {
    smtp = await startFakeSmtp(Number(process.env.SMTP_PORT));
  });

  test.afterAll(async () => {
    await smtp?.close();
  });

  test("sends a reachout email from the configured sender", async ({ page }) => {
    const dialog = await openComposer(page);
    const to = `booker-${Date.now()}@tour-planner.test`;
    const subject = `E2E pitch ${Date.now()}`;
    const toInput = dialog.getByPlaceholder("booking@venue.com");

    // Prefilled from the reachout's contact — replace it with a test address
    await expect(toInput).toHaveValue("tom@paradiserock.com");
    await toInput.fill(to);
    await dialog.getByPlaceholder("Booking inquiry — [Artist Name]").fill(subject);
    await dialog.getByPlaceholder("Write your email...").fill("Hello from the E2E suite\nSecond line");
    await dialog.getByRole("button", { name: "Send Email" }).click();

    // Composer closes and the email shows up in the reachout's history as sent
    await expect(dialog.locator("text=Compose Email")).not.toBeVisible({ timeout: 15_000 });
    const entry = dialog.locator("div.min-w-0", { hasText: subject });
    await expect(entry).toContainText("Sent");
    await expect(entry).toContainText(to);

    const delivered = smtp.messages.filter((m) => m.to.includes(to));
    expect(delivered).toHaveLength(1);
    expect(delivered[0].from).toBe("sender@tour-planner.test");
    expect(delivered[0].to).toEqual([to]);
    expect(delivered[0].data).toMatch(/^From: "?E2E Sender"? <sender@tour-planner\.test>$/m);
    expect(delivered[0].data).toContain(`Subject: ${subject}`);
    expect(delivered[0].data).toContain("Hello from the E2E suite<br>Second line");
  });

  test("shows the error when the mail server rejects the recipient", async ({ page }) => {
    const dialog = await openComposer(page);
    const to = `nobody-${Date.now()}@${REJECT_DOMAIN}`;

    await dialog.getByPlaceholder("booking@venue.com").fill(to);
    await dialog.getByPlaceholder("Booking inquiry — [Artist Name]").fill("E2E rejected pitch");
    await dialog.getByPlaceholder("Write your email...").fill("This one should bounce");
    await dialog.getByRole("button", { name: "Send Email" }).click();

    await expect(dialog.locator("text=/rejected/i")).toBeVisible({ timeout: 15_000 });
    // Composer stays open so the user can fix the address and retry
    await expect(dialog.getByPlaceholder("booking@venue.com")).toHaveValue(to);
    expect(smtp.messages.filter((m) => m.data.includes("E2E rejected pitch"))).toHaveLength(0);
  });
});
