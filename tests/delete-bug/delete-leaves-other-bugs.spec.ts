import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  deleteButton,
  login,
  openBug,
  searchBugs,
  type Bug,
} from "./helpers";

test.describe("Delete bug: other bugs", () => {
  let bugA: Bug;
  let bugB: Bug;

  test.beforeEach(async ({ page, request }) => {
    const prefix = `Delete others ${randomUUID()}`;
    bugA = await createBug(request, `${prefix} A`);
    bugB = await createBug(request, `${prefix} B`);
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugsQuietly(request, [bugA, bugB]);
  });

  test("Deleting one bug leaves other bugs untouched", async ({
    page,
    request,
  }) => {
    await openBug(page, bugA.title);

    await deleteButton(page).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await searchBugs(page, bugB.title);
    await expect(bugRow(page, bugB.title)).toBeVisible();
    await expect(bugRow(page, bugA.title)).toHaveCount(0);
    const response = await request.get(`/api/bugs/${bugB.id}`);
    expect(response.status()).toBe(200);
  });
});
