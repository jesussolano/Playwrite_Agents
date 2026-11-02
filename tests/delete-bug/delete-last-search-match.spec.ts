import { test, expect } from "@playwright/test";
import {
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  openBug,
  uniqueTitle,
  type Bug,
} from "./helpers";

test.describe("Delete bug: last search match", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("last-match"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleting the last search match shows the empty state", async ({
    page,
  }) => {
    await openBug(page, bug.title);

    await deleteButton(page).click();

    await expect(
      page.getByRole("search", { name: "Search bugs by title" })
    ).toHaveValue(bug.title);
    await expect(page.getByText("No bugs matched.")).toBeVisible();
  });
});
