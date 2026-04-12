# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-interactive.spec.ts >> Interactive components (mocked auth) >> insights page — tabs or metric cards are present
- Location: tests/e2e/04-interactive.spec.ts:58:3

# Error details

```
Error: Insights page should have tabs or metric cards

expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
  1   | import { test, expect } from '@playwright/test';
  2   | import { injectMockAuth } from './helpers/mock-auth';
  3   | 
  4   | async function interceptDataCalls(page: import('@playwright/test').Page) {
  5   |   await page.route('**/rest/v1/**', async (route) => {
  6   |     if (route.request().method() === 'GET') {
  7   |       await route.fulfill({
  8   |         status: 200,
  9   |         contentType: 'application/json',
  10  |         headers: { 'content-range': '0-0/0' },
  11  |         body: '[]',
  12  |       });
  13  |     } else {
  14  |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  15  |     }
  16  |   });
  17  | }
  18  | 
  19  | test.describe('Interactive components (mocked auth)', () => {
  20  |   test.beforeEach(async ({ page }) => {
  21  |     await injectMockAuth(page);
  22  |     await interceptDataCalls(page);
  23  |   });
  24  | 
  25  |   test('sidebar search input accepts text', async ({ page }) => {
  26  |     await page.goto('/insights', { waitUntil: 'domcontentloaded' });
  27  |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  28  | 
  29  |     // Look for any search input in the sidebar or header area
  30  |     const searchInput = page.locator(
  31  |       'aside input[type="text"], aside input[type="search"], nav input, header input[type="text"], header input[type="search"]'
  32  |     ).first();
  33  | 
  34  |     const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
  35  |     if (!isVisible) {
  36  |       test.skip(true, 'No sidebar/header search input found — may use different selector');
  37  |       return;
  38  |     }
  39  |     await searchInput.fill('order');
  40  |     await expect(searchInput).toHaveValue('order');
  41  |   });
  42  | 
  43  |   test('top header search input accepts text', async ({ page }) => {
  44  |     await page.goto('/insights', { waitUntil: 'domcontentloaded' });
  45  |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  46  | 
  47  |     // The AppLayout has a .hidden md:flex search in the header
  48  |     const searchInput = page.locator('header input').first();
  49  |     const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
  50  |     if (!isVisible) {
  51  |       test.skip(true, 'Header search input not visible');
  52  |       return;
  53  |     }
  54  |     await searchInput.fill('inventory');
  55  |     await expect(searchInput).toHaveValue('inventory');
  56  |   });
  57  | 
  58  |   test('insights page — tabs or metric cards are present', async ({ page }) => {
  59  |     await page.goto('/insights', { waitUntil: 'domcontentloaded' });
  60  |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  61  | 
  62  |     // Check for tabs, metric cards, or any interactive elements
  63  |     const tabs = page.locator('[role="tab"], [data-testid*="tab"], button[class*="tab"]');
  64  |     const cards = page.locator('[class*="card"], [class*="metric"], [class*="stat"]');
  65  | 
  66  |     const tabCount = await tabs.count();
  67  |     const cardCount = await cards.count();
> 68  |     expect(tabCount + cardCount, 'Insights page should have tabs or metric cards').toBeGreaterThan(0);
      |                                                                                    ^ Error: Insights page should have tabs or metric cards
  69  |   });
  70  | 
  71  |   test('sidebar trigger button is clickable', async ({ page }) => {
  72  |     await page.goto('/insights', { waitUntil: 'domcontentloaded' });
  73  |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  74  | 
  75  |     // SidebarTrigger is a button in the header
  76  |     const trigger = page.locator('header button').first();
  77  |     const isVisible = await trigger.isVisible({ timeout: 5000 }).catch(() => false);
  78  |     if (!isVisible) {
  79  |       test.skip(true, 'Sidebar trigger not found');
  80  |       return;
  81  |     }
  82  |     await trigger.click();
  83  |     // After clicking, sidebar state changes — just verify no crash
  84  |     await expect(page).not.toHaveURL(/\/login/);
  85  |   });
  86  | 
  87  |   test('screenshot: insights page', async ({ page }) => {
  88  |     await page.goto('/insights', { waitUntil: 'domcontentloaded' });
  89  |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  90  |     await page.screenshot({ path: 'tests/e2e/screenshots/insights-page.png', fullPage: true });
  91  |   });
  92  | 
  93  |   test('screenshot: orders page', async ({ page }) => {
  94  |     await page.goto('/orders', { waitUntil: 'domcontentloaded' });
  95  |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  96  |     await page.screenshot({ path: 'tests/e2e/screenshots/orders-page.png', fullPage: true });
  97  |   });
  98  | 
  99  |   test('screenshot: inventory page', async ({ page }) => {
  100 |     await page.goto('/inventory', { waitUntil: 'domcontentloaded' });
  101 |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  102 |     await page.screenshot({ path: 'tests/e2e/screenshots/inventory-page.png', fullPage: true });
  103 |   });
  104 | 
  105 |   test('screenshot: analytics page', async ({ page }) => {
  106 |     await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
  107 |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  108 |     await page.screenshot({ path: 'tests/e2e/screenshots/analytics-page.png', fullPage: true });
  109 |   });
  110 | 
  111 |   test('screenshot: reports page', async ({ page }) => {
  112 |     await page.goto('/reports', { waitUntil: 'domcontentloaded' });
  113 |     await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
  114 |     await page.screenshot({ path: 'tests/e2e/screenshots/reports-page.png', fullPage: true });
  115 |   });
  116 | });
  117 | 
```