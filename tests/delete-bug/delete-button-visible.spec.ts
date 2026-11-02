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

test.describe("Delete bug: button visibility", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("button-visible"));
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Edit modal shows an enabled Delete button", async ({ page }) => {
    await openBug(page, bug.title);

    await expect(
      page.getByRole("heading", { name: `Edit bug #${bug.id}` })
    ).toBeVisible();
    await expect(deleteButton(page)).toBeVisible();
    await expect(deleteButton(page)).toBeEnabled();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "Save" })
    ).toBeDisabled();
  });
});
