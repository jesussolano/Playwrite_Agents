import fs from "fs";
import path from "path";
import { randomUUID } from "node:crypto";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

const users: { username: string; password: string }[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), "users.json"), "utf-8")
);

export type Bug = { id: number; title: string };

export function uniqueTitle(label: string): string {
  return `Delete ${label} ${randomUUID()}`;
}

export async function login(page: Page): Promise<void> {
  const { username, password } = users[0];
  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/board/);
}

export async function createBug(
  request: APIRequestContext,
  title: string,
  options: { closed?: boolean } = {}
): Promise<Bug> {
  const response = await request.post("/api/bugs", {
    data: {
      title,
      severity: "mid",
      owner: users[0].username,
      description: "Created by delete-bug test setup",
    },
  });
  expect(response.ok()).toBeTruthy();
  const bug = await response.json();
  if (options.closed) {
    const update = await request.put(`/api/bugs/${bug.id}`, {
      data: { ...bug, state: "CLOSED" },
    });
    expect(update.ok()).toBeTruthy();
  }
  return { id: bug.id, title };
}

export async function deleteBugsQuietly(
  request: APIRequestContext,
  bugs: Bug[]
): Promise<void> {
  for (const bug of bugs) {
    await request.delete(`/api/bugs/${bug.id}`);
  }
}

export async function searchBugs(page: Page, text: string): Promise<void> {
  await page.getByRole("search", { name: "Search bugs by title" }).fill(text);
}

export function bugRow(page: Page, title: string) {
  return page
    .getByRole("table", { name: "Bugs" })
    .getByRole("button", { name: title });
}

export async function openBug(page: Page, title: string): Promise<void> {
  await searchBugs(page, title);
  await bugRow(page, title).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

export function deleteButton(page: Page) {
  return page.getByRole("dialog").getByRole("button", {
    name: "Delete",
    exact: true,
  });
}
