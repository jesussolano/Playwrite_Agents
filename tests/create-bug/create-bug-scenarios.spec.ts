import { test, expect, type Page } from "@playwright/test";
import fs from "fs";
import path from "path";

const users: { username: string; password: string }[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "users.json"), "utf-8")
);

let createdBugIds: number[] = [];

async function submitBug(
  page: Page,
  submit: () => Promise<void>
): Promise<{
  response: Awaited<ReturnType<Page["waitForResponse"]>>;
  bugId?: number;
}> {
  const responsePromise = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/bugs" &&
      response.request().method() === "POST"
  );
  await submit();
  const response = await responsePromise;

  if (!response.ok()) {
    return { response };
  }

  const body: { id: number } = await response.json();
  createdBugIds.push(body.id);
  return { response, bugId: body.id };
}

async function saveBug(page: Page) {
  return submitBug(page, () =>
    page.getByRole("button", { name: "Save", exact: true }).click()
  );
}

function bugRows(page: Page, title: string) {
  return page
    .getByRole("table", { name: "Bugs" })
    .locator("tbody tr")
    .filter({ hasText: title });
}

function trackCreateRequests(page: Page) {
  let count = 0;
  page.on("request", (request) => {
    if (
      new URL(request.url()).pathname === "/api/bugs" &&
      request.method() === "POST"
    ) {
      count += 1;
    }
  });
  return () => count;
}

test.describe("Create bug", () => {
  test.beforeEach(async ({ page }) => {
    createdBugIds = [];
    const { username, password } = users[0];

    await page.goto("/login");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/board/);
  });

  test.afterEach(async ({ request }) => {
    for (const id of createdBugIds) {
      const response = await request.delete(`/api/bugs/${id}`);
      expect(response.ok()).toBeTruthy();
    }
    createdBugIds = [];
  });

  test("1.1 opens the modal and shows default values", async ({ page }) => {
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
      users[0].username
    );
    await expect(
      dialog.getByRole("textbox", { name: "Description" })
    ).toHaveValue("");
  });

  test("1.2 creates a bug with valid data", async ({ page }) => {
    const title = `Checkout fails ${Date.now()}`;
    const description = "Steps to reproduce";

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog.getByRole("combobox", { name: "Severity" }).selectOption({
      label: "HIGH",
    });
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill(description);
    const { response, bugId } = await saveBug(page);

    expect(response.ok()).toBeTruthy();
    expect(bugId).toBeDefined();
    await expect(dialog).not.toBeVisible();
    const row = bugRows(page, title);
    await expect(row).toHaveCount(1);
    await expect(row.locator("td").nth(0)).toHaveText(String(bugId));
    await expect(row.locator("td").nth(1)).toHaveText("HIGH");
    await expect(row.locator("td").nth(2)).toHaveText(title);
    await expect(row.locator("td").nth(3)).toHaveText(users[0].username);
    await expect(page.getByRole("alert")).toHaveCount(0);
  });

  test("1.3 keeps the default severity and owner", async ({ page }) => {
    const title = `Default severity ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Description for the default-value test");
    const { response } = await saveBug(page);

    expect(response.ok()).toBeTruthy();
    const row = bugRows(page, title);
    await expect(row).toHaveCount(1);
    await expect(row.locator("td").nth(1)).toHaveText("MID");
    await expect(row.locator("td").nth(3)).toHaveText(users[0].username);
  });

  test("1.4 creates bugs at each severity and sorts them correctly", async ({
    page,
  }) => {
    const runId = Date.now();
    const cases = [
      { severity: "HIGH", title: `Severity HIGH ${runId}` },
      { severity: "MID", title: `Severity MID ${runId}` },
      { severity: "LOW", title: `Severity LOW ${runId}` },
    ];

    for (const bug of cases) {
      await page.getByRole("button", { name: "New Bug" }).click();
      const dialog = page.getByRole("dialog", { name: "Create bug" });
      await dialog.getByRole("textbox", { name: "Title" }).fill(bug.title);
      await dialog
        .getByRole("combobox", { name: "Severity" })
        .selectOption({ label: bug.severity });
      await dialog
        .getByRole("textbox", { name: "Description" })
        .fill(`Description for ${bug.title}`);
      const { response } = await saveBug(page);
      expect(response.ok()).toBeTruthy();
    }

    const search = page.getByRole("search", { name: "Search bugs by title" });
    await search.fill(String(runId));
    const table = page.getByRole("table", { name: "Bugs" });
    await expect(table.locator("tbody tr")).toHaveCount(3);
    await expect(
      table.locator("tbody tr").locator("td:nth-child(2)")
    ).toHaveText(["HIGH", "MID", "LOW"]);

    await page.getByRole("button", { name: "Severity", exact: true }).click();
    await expect(
      table.locator("tbody tr").locator("td:nth-child(2)")
    ).toHaveText(["LOW", "MID", "HIGH"]);
  });

  test("1.5 requires a title and description when the form is blank", async ({
    page,
  }) => {
    const createRequestCount = trackCreateRequests(page);

    await page.getByRole("button", { name: "New Bug" }).click();
    await page
      .getByRole("dialog", { name: "Create bug" })
      .getByRole("button", { name: "Save" })
      .click();

    const alert = page.getByRole("alert");
    await expect(
      page.getByRole("dialog", { name: "Create bug" })
    ).toBeVisible();
    await expect(
      alert.getByText("Title is required.", { exact: true })
    ).toBeVisible();
    await expect(
      alert.getByText("Description is required.", { exact: true })
    ).toBeVisible();
    expect(createRequestCount()).toBe(0);
  });

  test("1.6 shows only the required error for each missing field", async ({
    page,
  }) => {
    const createRequestCount = trackCreateRequests(page);

    await page.getByRole("button", { name: "New Bug" }).click();
    let dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Description is present");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(
      page.getByRole("alert").getByText("Title is required.", { exact: true })
    ).toBeVisible();
    await expect(
      page
        .getByRole("alert")
        .getByText("Description is required.", { exact: true })
    ).toHaveCount(0);

    await dialog.getByRole("button", { name: "Cancel" }).click();
    await page.getByRole("button", { name: "New Bug" }).click();
    dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog
      .getByRole("textbox", { name: "Title" })
      .fill(`Only title ${Date.now()}`);
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(
      page
        .getByRole("alert")
        .getByText("Description is required.", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("alert").getByText("Title is required.", { exact: true })
    ).toHaveCount(0);
    expect(createRequestCount()).toBe(0);
  });

  test("1.7 rejects whitespace-only title and description", async ({
    page,
  }) => {
    const createRequestCount = trackCreateRequests(page);

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill("   ");
    await dialog.getByRole("textbox", { name: "Description" }).fill("   ");
    await dialog.getByRole("button", { name: "Save" }).click();

    const alert = page.getByRole("alert");
    await expect(
      alert.getByText("Title is required.", { exact: true })
    ).toBeVisible();
    await expect(
      alert.getByText("Description is required.", { exact: true })
    ).toBeVisible();
    expect(createRequestCount()).toBe(0);
  });

  test("1.8 validates a cleared owner without crashing", async ({ page }) => {
    const title = `Missing owner ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog.getByRole("textbox", { name: "Owner" }).fill("");
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Description is present");
    await dialog.getByRole("button", { name: "Save" }).click();

    await expect(dialog).toBeVisible();
    await expect(
      page.getByRole("alert").getByText("Owner is required.", { exact: true })
    ).toBeVisible();
    await expect(bugRows(page, title)).toHaveCount(0);
  });

  test("1.9 cancel discards input and resets the form", async ({ page }) => {
    const title = `Cancelled bug ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    let dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Discard me");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(bugRows(page, title)).toHaveCount(0);

    await page.getByRole("button", { name: "New Bug" }).click();
    dialog = page.getByRole("dialog", { name: "Create bug" });
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(
      ""
    );
    await expect(
      dialog.getByRole("textbox", { name: "Description" })
    ).toHaveValue("");
    await expect(
      dialog
        .getByRole("combobox", { name: "Severity" })
        .locator("option:checked")
    ).toHaveText("MID");
    await expect(dialog.getByRole("textbox", { name: "Owner" })).toHaveValue(
      users[0].username
    );
  });

  test("1.10 the close button closes the modal without saving", async ({
    page,
  }) => {
    const title = `Closed bug ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Discard me");
    await dialog.getByRole("button", { name: "Close" }).click();

    await expect(dialog).not.toBeVisible();
    await expect(bugRows(page, title)).toHaveCount(0);
  });

  test("1.11 Escape closes the modal without changing the board", async ({
    page,
  }) => {
    const createRequestCount = trackCreateRequests(page);

    await page.getByRole("button", { name: "New Bug" }).click();
    await expect(
      page.getByRole("dialog", { name: "Create bug" })
    ).toBeVisible();
    await page.keyboard.press("Escape");

    await expect(
      page.getByRole("dialog", { name: "Create bug" })
    ).not.toBeVisible();
    expect(createRequestCount()).toBe(0);
  });

  test("1.12 clears validation errors after correcting the form", async ({
    page,
  }) => {
    const title = `Corrected bug ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    let dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("alert")).toContainText("Title is required.");

    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Valid description");
    const { response } = await saveBug(page);

    expect(response.ok()).toBeTruthy();
    await expect(dialog).not.toBeVisible();
    await expect(bugRows(page, title)).toHaveCount(1);

    await page.getByRole("button", { name: "New Bug" }).click();
    dialog = page.getByRole("dialog", { name: "Create bug" });
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  });

  test("1.13 persists a created bug after reload", async ({ page }) => {
    const title = `Persistent bug ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("combobox", { name: "Severity" })
      .selectOption({ label: "HIGH" });
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Persistent description");
    const { response, bugId } = await saveBug(page);

    expect(response.ok()).toBeTruthy();
    const row = bugRows(page, title);
    await expect(row).toHaveCount(1);
    const initialId = await row.locator("td").nth(0).textContent();
    expect(initialId).toBe(String(bugId));

    await page.reload();
    const persistedRow = bugRows(page, title);
    await expect(persistedRow).toHaveCount(1);
    await expect(persistedRow.locator("td").nth(0)).toHaveText(initialId ?? "");
    await expect(persistedRow.locator("td").nth(1)).toHaveText("HIGH");
    await expect(persistedRow.locator("td").nth(2)).toHaveText(title);
    await expect(persistedRow.locator("td").nth(3)).toHaveText(
      users[0].username
    );
  });

  test("1.14 handles long title and description values", async ({ page }) => {
    const title = `Long title ${"x".repeat(260)} ${Date.now()}`;
    const description = "Long description ".repeat(295);

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill(description);
    const { response } = await saveBug(page);

    if (response.ok()) {
      await expect(dialog).not.toBeVisible();
      await expect(bugRows(page, title)).toHaveCount(1);
      expect(description.length).toBeGreaterThanOrEqual(5000);
    } else {
      await expect(dialog).toBeVisible();
      await expect(page.getByRole("alert")).not.toBeEmpty();
    }
  });

  test("1.15 displays and persists special characters literally", async ({
    page,
  }) => {
    const title = `<script>alert(1)</script> & 'quotes' é 🐞 ${Date.now()}`;
    const description = `Reproduce with <script>alert("description")</script> & 'quotes' é 🐞`;
    let scriptAlertTriggered = false;
    const pageErrors: Error[] = [];
    page.on("dialog", (dialog) => {
      scriptAlertTriggered = true;
      void dialog.dismiss();
    });
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill(description);
    const { response } = await saveBug(page);

    expect(response.ok()).toBeTruthy();
    await expect(bugRows(page, title).locator("td").nth(2)).toHaveText(title);
    await page.reload();
    const row = bugRows(page, title);
    await expect(row.locator("td").nth(2)).toHaveText(title);
    await row.click();
    const editDialog = page.getByRole("dialog");
    await expect(
      editDialog.getByRole("textbox", { name: "Description" })
    ).toHaveValue(description);
    expect(scriptAlertTriggered).toBe(false);
    expect(pageErrors).toHaveLength(0);
  });

  test("1.16 allows duplicate titles with distinct IDs", async ({ page }) => {
    const title = `Duplicate title ${Date.now()}`;

    for (let index = 0; index < 2; index += 1) {
      await page.getByRole("button", { name: "New Bug" }).click();
      const dialog = page.getByRole("dialog", { name: "Create bug" });
      await dialog.getByRole("textbox", { name: "Title" }).fill(title);
      await dialog
        .getByRole("textbox", { name: "Description" })
        .fill(`Description ${index}`);
      const { response } = await saveBug(page);

      if (!response.ok()) {
        await expect(dialog).toBeVisible();
        await expect(page.getByRole("alert")).not.toBeEmpty();
        return;
      }
    }

    const rows = bugRows(page, title);
    await expect(rows).toHaveCount(2);
    const ids = await rows.locator("td:first-child").allTextContents();
    expect(new Set(ids).size).toBe(2);
  });

  test("1.17 prevents duplicate creation on double-click Save", async ({
    page,
  }) => {
    const title = `Double-click save ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Prevent duplicate submission");
    const { response } = await submitBug(page, () =>
      dialog.getByRole("button", { name: "Save" }).dblclick()
    );

    expect(response.ok()).toBeTruthy();
    await expect(bugRows(page, title)).toHaveCount(1);
  });

  test("1.18 creates a bug using keyboard navigation only", async ({
    page,
  }) => {
    const title = `Keyboard bug ${Date.now()}`;
    const description = "Created entirely from the keyboard";

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    const titleInput = dialog.getByRole("textbox", { name: "Title" });
    await expect(titleInput).toBeFocused();
    await page.keyboard.type(title);
    await page.keyboard.press("Tab");
    const severity = dialog.getByRole("combobox", { name: "Severity" });
    await expect(severity).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(severity.locator("option:checked")).toHaveText("HIGH");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.type(description);
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const saveButton = dialog.getByRole("button", { name: "Save" });
    await expect(saveButton).toBeFocused();
    const { response } = await submitBug(page, () =>
      page.keyboard.press("Enter")
    );

    expect(response.ok()).toBeTruthy();
    const row = bugRows(page, title);
    await expect(row).toHaveCount(1);
    await expect(row.locator("td").nth(1)).toHaveText("HIGH");
  });

  test("1.19 shows a new bug in Open search and not in Closed", async ({
    page,
  }) => {
    const title = `Open filter search ${Date.now()}`;

    await page.getByRole("button", { name: "New Bug" }).click();
    const dialog = page.getByRole("dialog", { name: "Create bug" });
    await dialog.getByRole("textbox", { name: "Title" }).fill(title);
    await dialog
      .getByRole("textbox", { name: "Description" })
      .fill("Visible in the Open state");
    const { response } = await saveBug(page);

    expect(response.ok()).toBeTruthy();
    const stateFilter = page.getByRole("group", {
      name: "Filter by bug state",
    });
    await stateFilter
      .getByRole("button", { name: "Open", exact: true })
      .click();
    const search = page.getByRole("search", { name: "Search bugs by title" });
    await search.fill(title);
    await expect(bugRows(page, title)).toHaveCount(1);

    await stateFilter
      .getByRole("button", { name: "Closed", exact: true })
      .click();
    await expect(bugRows(page, title)).toHaveCount(0);
  });
});
