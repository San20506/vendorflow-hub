import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/mock-auth';

const PAGES = [
  { path: '/insights', label: 'Insights' },
  { path: '/inventory', label: 'Inventory' },
  { path: '/orders', label: 'Orders' },
  { path: '/returns', label: 'Returns' },
  { path: '/settlements', label: 'Settlements' },
  { path: '/products-catalog', label: 'Products Catalog' },
  { path: '/reconciliation', label: 'Reconciliation' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/reports', label: 'Reports' },
  { path: '/expenses', label: 'Expenses' },
];

test.describe('Navigation — sidebar and routing (mocked auth)', () => {
  test('sidebar is visible after auth injection', async ({ page }) => {
    await injectMockAuth(page);
    await page.goto('/insights');
    // Wait for loading spinner to disappear
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
    const sidebar = page.locator('nav, [data-testid="sidebar"], aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 10000 });
  });

  for (const { path, label } of PAGES) {
    test(`navigates to ${label} (${path})`, async ({ page }) => {
      await injectMockAuth(page);
      await page.goto(path);
      // Confirm URL is correct (no redirect to /login)
      await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 10000 });
    });
  }
});
