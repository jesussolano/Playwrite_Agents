import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";

const bugData = [
  {
    title: "Login page crashes on empty password",
    severity: "HIGH",
    owner: "buggy",
    description: "App crashes when submitting an empty password on login.",
  },
  {
    title: "Login page redirect fails after auth",
    severity: "MID",
    owner: "buggy",
    description: "User is not redirected to board after successful login.",
  },
  {
    title: "Login page error message not shown",
    severity: "LOW",
    owner: "buggy",
    description: "No error message appears for invalid credentials.",
  },
  {
    title: "Login page enter key stops working",
    severity: "MID",
    owner: "buggy",
    description: "Enter key does not submit the login form.",
  },
  {
    title: "Board page fails to load",
    severity: "HIGH",
    owner: "buggy",
    description: "The bug board is empty even when bugs exist in the database.",
  },
  {
    title: "Search field disappears on page resize",
    severity: "LOW",
    owner: "buggy",
    description: "The search input is not visible after resizing the window.",
  },
  {
    title: "Severity dropdown missing on create page",
    severity: "MID",
    owner: "buggy",
    description:
      "The severity dropdown does not render in the create bug modal.",
  },
  {
    title: "Create page modal does not close on cancel",
    severity: "LOW",
    owner: "buggy",
    description: "The create bug modal stays open after clicking Cancel.",
  },
  {
    title: "Title bar logo missing on page load",
    severity: "LOW",
    owner: "buggy",
    description: "The logo image does not appear in the title bar.",
  },
  {
    title: "Sort resets on page refresh",
    severity: "MID",
    owner: "buggy",
    description: "Sorting order is lost when the page is refreshed.",
  },
];

test.describe("Search Bug", () => {
  let createdBugIds: number[] = [];
  let testBugs: typeof bugData = [];

  test.beforeEach(async ({ page, request }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill("buggy");
    await page.getByLabel("Password").fill("1970beetle");
    await page.getByRole("button", { name: "Login" }).click();
    await page.waitForURL(/\/board$/);

    createdBugIds = [];
    const runId = randomUUID();
    testBugs = bugData.map((bug) => ({
      ...bug,
      title: `${bug.title} ${runId}`,
    }));
    for (const bug of testBugs) {
      const response = await request.post("/api/bugs", { data: bug });
      const body = await response.json();
      createdBugIds.push(body.id);
    }

    await page.reload();
  });

  test.afterEach(async ({ request }) => {
    for (const id of createdBugIds) {
      await request.delete(`/api/bugs/${id}`);
    }
    createdBugIds = [];
  });

  test("shows all bugs matching the search term", async ({ page }) => {
    await page
      .getByRole("search", { name: "Search bugs by title" })
      .fill("page");

    for (const bug of testBugs) {
      await expect(
        page.getByRole("cell", { name: bug.title, exact: true })
      ).toBeVisible();
    }
  });

  test("shows only bugs matching the search term", async ({ page }) => {
    await page
      .getByRole("search", { name: "Search bugs by title" })
      .fill("login");

    for (const bug of testBugs.filter((bug) => bug.title.startsWith("Login"))) {
      await expect(
        page.getByRole("cell", { name: bug.title, exact: true })
      ).toBeVisible();
    }

    for (const bug of testBugs.filter(
      (bug) => !bug.title.startsWith("Login")
    )) {
      await expect(
        page.getByRole("cell", { name: bug.title, exact: true })
      ).not.toBeVisible();
    }
  });

  test("shows a no-results message when no bugs match", async ({ page }) => {
    await page
      .getByRole("search", { name: "Search bugs by title" })
      .fill("xyzzy");

    await expect(
      page.getByRole("cell", { name: "No bugs matched.", exact: true })
    ).toBeVisible();

    for (const bug of testBugs) {
      await expect(
        page.getByRole("cell", { name: bug.title, exact: true })
      ).not.toBeVisible();
    }
  });
});
