import { test, expect } from "@playwright/test";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  login,
  searchBugs,
  uniqueTitle,
  type Bug,
} from "./helpers";

test.describe("Delete bug: keyboard", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("keyboard"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Delete a bug using the keyboard only", async ({ page }) => {
    await searchBugs(page, bug.title);
    await bugRow(page, bug.title).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();

    const deleteButton = page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete", exact: true });
    await deleteButton.focus();
    await expect(deleteButton).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("No bugs matched.")).toBeVisible();
  });
});
