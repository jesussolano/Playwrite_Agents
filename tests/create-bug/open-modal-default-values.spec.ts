import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const users: { username: string; password: string }[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "users.json"), "utf-8")
);

test.describe("Create bug", () => {
  test.beforeEach(async ({ page }) => {
    const { username, password } = users[0];

    await page.goto("/login");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/board/);
  });

  test("opens the modal with default values", async ({ page }) => {
    await page.getByRole("button", { name: "New Bug" }).click();

    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
      ""
    );
    await expect(
      dialog
        .getByRole("combobox", { name: "Severity" })
        .locator("option:checked")
    ).toHaveText("MID");
    await expect(dialog.getByRole("textbox", { name: "Owner" })).toHaveValue(
      "buggy"
    );
    await expect(
      dialog.getByRole("textbox", { name: "Description" })
    ).toHaveValue("");
  });
});
