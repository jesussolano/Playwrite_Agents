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

test.describe("Delete bug: unsaved edits", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("unsaved"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleting a bug with unsaved edits discards the edits", async ({
    page,
    request,
  }) => {
    await openBug(page, bug.title);
    await page
      .getByRole("dialog")
      .getByRole("textbox", { name: "Title" })
      .fill(`${bug.title} edited`);

    await deleteButton(page).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await searchBugs(page, bug.title);
    await expect(bugRow(page, bug.title)).toHaveCount(0);
    const response = await request.get(`/api/bugs/${bug.id}`);
    expect(response.status()).toBe(404);
  });
});
