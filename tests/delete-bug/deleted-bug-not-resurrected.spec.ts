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

test.describe("Delete bug: not resurrected", () => {
  let bug: Bug;
  let newTitle: string;

  test.beforeEach(async ({ page, request }) => {
    bug = await createBug(request, uniqueTitle("resurrect"));
    newTitle = uniqueTitle("resurrect-new");
    await login(page);
  });

  test.afterEach(async ({ request }) => {
    const response = await request.get("/api/bugs");
    const all: { id: number; title: string }[] = await response.json();
    const leftovers = all.filter((b) => b.title === newTitle);
    await deleteBugsQuietly(request, [bug, ...leftovers]);
  });

  test("Deleted bug is not shown again after creating a new bug", async ({
    page,
  }) => {
    await openBug(page, bug.title);
    await deleteButton(page).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(newTitle);
    await dialog.getByRole("textbox", { name: "Description" }).fill("temp");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog).toBeHidden();

    await searchBugs(page, bug.title);
    await expect(page.getByText("No bugs matched.")).toBeVisible();
    await searchBugs(page, newTitle);
    await expect(bugRow(page, newTitle)).toBeVisible();
  });
});
