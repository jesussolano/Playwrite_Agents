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

test.describe("Delete bug: already deleted elsewhere", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("already-deleted"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleting a bug that was already deleted does not crash the app", async ({
    page,
    request,
  }) => {
    await openBug(page, bug.title);
    await request.delete(`/api/bugs/${bug.id}`);

    await deleteButton(page).click();

    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("alert")).toHaveText("Bug not found.");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Cancel" })
      .click();
    await expect(page.getByRole("table", { name: "Bugs" })).toBeVisible();
    await page.reload();
    await expect(bugRow(page, bug.title)).toHaveCount(0);
  });
});
