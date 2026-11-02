import { test, expect } from "@playwright/test";
import {
  bugRow,
  createBug,
  deleteBugsQuietly,
  login,
  openBug,
  uniqueTitle,
  type Bug,
} from "./helpers";

const dismissals = [
  {
    name: "Cancel",
    dismiss: async (page: import("@playwright/test").Page) =>
      page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click(),
  },
  {
    name: "Close (×)",
    dismiss: async (page: import("@playwright/test").Page) =>
      page
        .getByRole("dialog")
        .getByRole("button", { name: "Close", exact: true })
        .click(),
  },
  {
    name: "Escape",
    dismiss: async (page: import("@playwright/test").Page) =>
      page.keyboard.press("Escape"),
  },
];

for (const { name, dismiss } of dismissals) {
  test.describe(`Delete bug: ${name} does not delete`, () => {
    let bug: Bug;

    test.beforeEach(async ({ page, request }) => {
      bug = await createBug(request, uniqueTitle("dismiss"));
      await login(page);
    });

    test.afterEach(async ({ request }) => {
      await deleteBugsQuietly(request, [bug]);
    });

    test(`${name} does not delete the bug`, async ({ page, request }) => {
      await openBug(page, bug.title);

      await dismiss(page);

      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(bugRow(page, bug.title)).toBeVisible();
      const response = await request.get(`/api/bugs/${bug.id}`);
      expect(response.status()).toBe(200);
    });
  });
}
