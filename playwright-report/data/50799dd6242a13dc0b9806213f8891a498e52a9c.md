# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-page-smoke.spec.ts >> Page smoke tests — all 10 critical pages >> Reconciliation — renders without crash
- Location: tests/e2e/03-page-smoke.spec.ts:37:5

# Error details

```
Error: Reconciliation should render visible content

expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
  17 | // Intercept all remaining Supabase data calls to return empty arrays
  18 | // so page components don't crash waiting for real data
  19 | async function interceptDataCalls(page: import('@playwright/test').Page) {
  20 |   await page.route('**/rest/v1/**', async (route) => {
  21 |     const method = route.request().method();
  22 |     if (method === 'GET') {
  23 |       await route.fulfill({
  24 |         status: 200,
  25 |         contentType: 'application/json',
  26 |         headers: { 'content-range': '0-0/0' },
  27 |         body: '[]',
  28 |       });
  29 |     } else {
  30 |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  31 |     }
  32 |   });
  33 | }
  34 | 
  35 | test.describe('Page smoke tests — all 10 critical pages', () => {
  36 |   for (const { path, label } of PAGES) {
  37 |     test(`${label} — renders without crash`, async ({ page }) => {
  38 |       const consoleErrors: string[] = [];
  39 |       page.on('console', (msg) => {
  40 |         if (msg.type() === 'error') consoleErrors.push(msg.text());
  41 |       });
  42 |       page.on('pageerror', (err) => {
  43 |         consoleErrors.push(`UNCAUGHT: ${err.message}`);
  44 |       });
  45 | 
  46 |       await injectMockAuth(page);
  47 |       await interceptDataCalls(page);
  48 |       await page.goto(path, { waitUntil: 'domcontentloaded' });
  49 | 
  50 |       // Wait for loading spinner to clear
  51 |       await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 15000 }).catch(() => {});
  52 | 
  53 |       // Should not be on /login
  54 |       await expect(page).not.toHaveURL(/\/login/, { timeout: 8000 });
  55 | 
  56 |       // Should not show error boundary message
  57 |       const errorBoundary = page.locator(
  58 |         'text=/something went wrong/i, text=/error boundary/i, text=/unhandled error/i'
  59 |       );
  60 |       await expect(errorBoundary).not.toBeVisible({ timeout: 3000 }).catch(() => {});
  61 | 
  62 |       // Should have some content rendered (heading, main, or article)
  63 |       const hasContent = await page
  64 |         .locator('h1, h2, h3, main, [role="main"], [class*="page"], [class*="dashboard"]')
  65 |         .first()
  66 |         .isVisible({ timeout: 8000 })
  67 |         .catch(() => false);
> 68 |       expect(hasContent, `${label} should render visible content`).toBe(true);
     |                                                                    ^ Error: Reconciliation should render visible content
  69 | 
  70 |       // Filter out known non-critical console noise
  71 |       const realErrors = consoleErrors.filter(
  72 |         (e) =>
  73 |           !e.includes('net::ERR_') &&
  74 |           !e.includes('favicon') &&
  75 |           !e.includes('Warning:') &&
  76 |           !e.includes('supabase') &&
  77 |           !e.includes('AbortError')
  78 |       );
  79 |       if (realErrors.length > 0) {
  80 |         console.warn(`[${label}] Console errors:`, realErrors.slice(0, 3));
  81 |       }
  82 |     });
  83 |   }
  84 | });
  85 | 
```