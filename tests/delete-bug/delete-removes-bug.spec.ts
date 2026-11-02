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

test.describe("Delete bug: removal", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("removes"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleting a bug removes it from the board and closes the modal", async ({
    page,
  }) => {
    await openBug(page, bug.title);

    await deleteButton(page).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(bugRow(page, bug.title)).toHaveCount(0);
    await expect(page.getByText("No bugs matched.")).toBeVisible();
  });
});
