import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const users: { username: string; password: string }[] = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'users.json'), 'utf-8'),
);

test.describe('Test group', () => {
  test('seed', async ({ page }) => {
    const { username, password } = users[0];

    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL(/\/board/);
  });
});
