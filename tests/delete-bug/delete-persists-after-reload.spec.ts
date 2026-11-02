import { test, expect } from "@playwright/test";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  openBug,
  searchBugs,
  uniqueTitle,
  type Bug,
} from "./helpers";

test.describe("Delete bug: persistence", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("persist"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deletion persists after a page reload", async ({ page }) => {
    await openBug(page, bug.title);
    await deleteButton(page).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.reload();
    await searchBugs(page, bug.title);

    await expect(page.getByText("No bugs matched.")).toBeVisible();
    await expect(bugRow(page, bug.title)).toHaveCount(0);
  });
});
