import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/FINFOLIO/);
});

test('can navigate to login', async ({ page }) => {
  await page.goto('/');

  // Assuming there's a login or enter button on the landing page
  // This is a placeholder test for authentication flow
  const loginLink = page.getByRole('link', { name: /login|enter/i });
  if (await loginLink.isVisible()) {
    await loginLink.click();
    await expect(page.locator('text=PIN')).toBeVisible();
  }
});
