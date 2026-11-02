import { test, expect } from "@playwright/test";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  openBug,
  uniqueTitle,
  type Bug,
} from "./helpers";

test.describe("Delete bug: server failure", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("failure"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Delete failure keeps the modal open and shows an error", async ({
    page,
    request,
  }) => {
    await page.route("**/api/bugs/*", async (route) => {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 500, body: "{}" });
      } else {
        await route.fallback();
      }
    });
    await openBug(page, bug.title);

    await deleteButton(page).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByText("Failed to delete bug.")).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel" })
      .click();
    await expect(bugRow(page, bug.title)).toBeVisible();
    const response = await request.get(`/api/bugs/${bug.id}`);
    expect(response.status()).toBe(200);
  });
});
