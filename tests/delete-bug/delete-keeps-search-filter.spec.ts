import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  searchBugs,
  type Bug,
} from "./helpers";

test.describe("Delete bug: search filter", () => {
  let prefix: string;
  let bugA: Bug;
  let bugB: Bug;

  test.beforeEach(async ({ page, request }) => {
    prefix = `Delete filter ${randomUUID()}`;
    bugA = await createBug(request, `${prefix} A`);
    bugB = await createBug(request, `${prefix} B`);
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bugA, bugB]);
  });

  test("Deleting a bug keeps the active search filter", async ({ page }) => {
    await searchBugs(page, prefix);
    await expect(bugRow(page, prefix)).toHaveCount(2);
    await bugRow(page, bugA.title).click();

    await deleteButton(page).click();

    await expect(
      page.getByRole("search", { name: "Search bugs by title" })
    ).toHaveValue(prefix);
    await expect(bugRow(page, prefix)).toHaveCount(1);
    await expect(bugRow(page, bugB.title)).toBeVisible();
  });
});
