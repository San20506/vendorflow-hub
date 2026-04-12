# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-navigation.spec.ts >> Navigation — sidebar and routing (mocked auth) >> sidebar is visible after auth injection
- Location: tests/e2e/02-navigation.spec.ts:18:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('nav, [data-testid="sidebar"], aside, [class*="sidebar"]').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('nav, [data-testid="sidebar"], aside, [class*="sidebar"]').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - region "Notifications (F8)":
    - list
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { injectMockAuth } from './helpers/mock-auth';
  3  | 
  4  | const PAGES = [
  5  |   { path: '/insights', label: 'Insights' },
  6  |   { path: '/inventory', label: 'Inventory' },
  7  |   { path: '/orders', label: 'Orders' },
  8  |   { path: '/returns', label: 'Returns' },
  9  |   { path: '/settlements', label: 'Settlements' },
  10 |   { path: '/products-catalog', label: 'Products Catalog' },
  11 |   { path: '/reconciliation', label: 'Reconciliation' },
  12 |   { path: '/analytics', label: 'Analytics' },
  13 |   { path: '/reports', label: 'Reports' },
  14 |   { path: '/expenses', label: 'Expenses' },
  15 | ];
  16 | 
  17 | test.describe('Navigation — sidebar and routing (mocked auth)', () => {
  18 |   test('sidebar is visible after auth injection', async ({ page }) => {
  19 |     await injectMockAuth(page);
  20 |     await page.goto('/insights');
  21 |     // Wait for loading spinner to disappear
  22 |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 10000 }).catch(() => {});
  23 |     const sidebar = page.locator('nav, [data-testid="sidebar"], aside, [class*="sidebar"]').first();
> 24 |     await expect(sidebar).toBeVisible({ timeout: 10000 });
     |                           ^ Error: expect(locator).toBeVisible() failed
  25 |   });
  26 | 
  27 |   for (const { path, label } of PAGES) {
  28 |     test(`navigates to ${label} (${path})`, async ({ page }) => {
  29 |       await injectMockAuth(page);
  30 |       await page.goto(path);
  31 |       // Confirm URL is correct (no redirect to /login)
  32 |       await expect(page).toHaveURL(new RegExp(path.replace('/', '\\/')), { timeout: 10000 });
  33 |     });
  34 |   }
  35 | });
  36 | 
```