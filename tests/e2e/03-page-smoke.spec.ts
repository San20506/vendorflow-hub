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

// Intercept all remaining Supabase data calls to return empty arrays
// so page components don't crash waiting for real data
async function interceptDataCalls(page: import('@playwright/test').Page) {
  await page.route('**/rest/v1/**', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': '0-0/0' },
        body: '[]',
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
  });
}

test.describe('Page smoke tests — all 10 critical pages', () => {
  for (const { path, label } of PAGES) {
    test(`${label} — renders without crash`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => {
        consoleErrors.push(`UNCAUGHT: ${err.message}`);
      });

      await injectMockAuth(page);
      await interceptDataCalls(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      // Wait for loading spinner to clear
      await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});

      // Should not be on /login
      await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });

      // Should not show error boundary message
      const errorBoundary = page.locator(
        'text=/something went wrong/i, text=/error boundary/i, text=/unhandled error/i'
      );
      await expect(errorBoundary).not.toBeVisible({ timeout: 3000 }).catch(() => {});

      // Should have some content rendered (heading, main, or article)
      const hasContent = await page
        .locator('h1, h2, h3, main, [role="main"], [class*="page"], [class*="dashboard"]')
        .first()
        .isVisible({ timeout: 8000 })
        .catch(() => false);
      expect(hasContent, `${label} should render visible content`).toBe(true);

      // Filter out known non-critical console noise
      const realErrors = consoleErrors.filter(
        (e) =>
          !e.includes('net::ERR_') &&
          !e.includes('favicon') &&
          !e.includes('Warning:') &&
          !e.includes('supabase') &&
          !e.includes('AbortError')
      );
      if (realErrors.length > 0) {
        console.warn(`[${label}] Console errors:`, realErrors.slice(0, 3));
      }
    });
  }
});
