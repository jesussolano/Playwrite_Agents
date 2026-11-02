import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  openBug,
  type Bug,
} from "./helpers";

test.describe("Delete bug: title containing 'delete'", () => {
  let bug: Bug;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, `Please delete me ${randomUUID()}`);
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bug]);
  });

  test("Deleting a bug whose title contains the word delete", async ({
    page,
  }) => {
    await openBug(page, bug.title);

    await deleteButton(page).click();

    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(bugRow(page, bug.title)).toHaveCount(0);
  });
});
