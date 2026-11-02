import { test, expect } from "@playwright/test";
import {
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  searchBugs,
  uniqueTitle,
  type Bug,
} from "./helpers";

test.describe("Delete bug: closed bugs", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("closed"), { closed: true });
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleting a closed bug from the Closed filter", async ({
    page,
    request,
  }) => {
    await page
      .getByRole("group", { name: "Filter by bug state" })
      .getByRole("button", { name: "Closed", exact: true })
      .click();
    await searchBugs(page, bug.title);
    await page
      .getByRole("table", { name: "Bugs" })
      .getByRole("button", { name: bug.title })
      .click();

    await deleteButton(page).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("No bugs matched.")).toBeVisible();
    const response = await request.get(`/api/bugs/${bug.id}`);
    expect(response.status()).toBe(404);
  });
});
