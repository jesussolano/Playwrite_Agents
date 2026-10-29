import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const users: { username: string; password: string }[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'users.json'), 'utf-8'),
);

test('logs in and creates a new bug', async ({ page }) => {
  const { username, password } = users[0];
  const title = `Login button misaligned ${Date.now()}`;

  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/board/);

  await page.getByRole('button', { name: 'New Bug' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create bug' });
  await expect(dialog).toBeVisible();

  await dialog.getByLabel('Title').fill(title);
  await dialog.getByLabel('Severity').selectOption('high');
  await dialog.getByLabel('Owner').fill(username);
  await dialog.getByLabel('Description').fill('The login button is misaligned on small screens.');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByRole('table', { name: 'Bugs' })).toContainText(title);
});
