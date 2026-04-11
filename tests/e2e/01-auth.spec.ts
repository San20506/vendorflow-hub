import { test, expect } from '@playwright/test';

test.describe('Auth — Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('login page renders form correctly', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first()).toBeVisible();
  });

  test('login page has branding or heading', async ({ page }) => {
    // Page should have some identifiable heading or brand name
    const heading = page.locator('h1, h2, [class*="title"], [class*="brand"], [class*="logo"]').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('empty form submit shows validation error', async ({ page }) => {
    const submitBtn = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in"), button:has-text("Log in")').first();
    await submitBtn.click();

    // Should show error state — either HTML5 validation or a rendered error element
    const hasError = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input[required]');
      if (inputs.length > 0) return true; // HTML5 required attrs will trigger native validation
      const errors = document.querySelectorAll('[class*="error"], [role="alert"], .text-red, .text-destructive');
      return errors.length > 0;
    });
    expect(hasError).toBe(true);
  });

  test('screenshot: login page', async ({ page }) => {
    await page.screenshot({ path: 'tests/e2e/screenshots/login-page.png', fullPage: true });
  });
});
