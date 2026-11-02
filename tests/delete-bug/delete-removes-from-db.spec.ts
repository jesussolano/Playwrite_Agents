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

test.describe("Delete bug: database removal", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("db"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleted bug is removed from the database", async ({
    page,
    request,
  }) => {
    await openBug(page, bug.title);

    await deleteButton(page).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    const response = await request.get(`/api/bugs/${bug.id}`);
    expect(response.status()).toBe(404);
  });
});
