# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-ux-verification.spec.ts >> VendorFlow UI/UX Verification >> 05: Dialog components accessible and closeable
- Location: tests/e2e/ui-ux-verification.spec.ts:89:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "networkidle"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('VendorFlow UI/UX Verification', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     // Navigate to app
> 6   |     await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  7   |   });
  8   | 
  9   |   test('01: Login page loads and renders correctly', async ({ page }) => {
  10  |     // Check page title
  11  |     const title = await page.title();
  12  |     expect(title).toBeDefined();
  13  | 
  14  |     // Check login form exists
  15  |     const emailInput = page.locator('input[type="email"]');
  16  |     const submitButton = page.locator('button:has-text("Sign in"), button:has-text("Login")');
  17  | 
  18  |     await expect(emailInput).toBeVisible({ timeout: 5000 });
  19  |     await expect(submitButton).toBeVisible({ timeout: 5000 });
  20  |   });
  21  | 
  22  |   test('02: Navigation sidebar renders correctly', async ({ page, context }) => {
  23  |     // Set up auth - use localStorage to bypass auth if possible
  24  |     await page.evaluate(() => {
  25  |       localStorage.setItem('sb-auth-token', JSON.stringify({
  26  |         access_token: 'test-token',
  27  |         user: { id: 'test-user' }
  28  |       }));
  29  |     });
  30  | 
  31  |     // Navigate to dashboard
  32  |     await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });
  33  | 
  34  |     // Check sidebar is visible
  35  |     const sidebar = page.locator('[role="navigation"], aside, .sidebar');
  36  |     const isVisible = await sidebar.isVisible().catch(() => false);
  37  | 
  38  |     // Check at least one nav item exists
  39  |     const navItems = page.locator('nav a, [role="menuitem"], button[title*="Dashboard"], button[title*="Orders"]');
  40  |     const count = await navItems.count().catch(() => 0);
  41  | 
  42  |     if (count === 0) {
  43  |       console.log('⚠️ Navigation items not found - auth may be required');
  44  |     } else {
  45  |       expect(count).toBeGreaterThan(0);
  46  |     }
  47  |   });
  48  | 
  49  |   test('03: Insights page layout responsive at multiple breakpoints', async ({ page }) => {
  50  |     await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });
  51  | 
  52  |     // Test at desktop (1440px)
  53  |     await page.setViewportSize({ width: 1440, height: 900 });
  54  |     const mainContent = page.locator('main, [class*="content"], [class*="main"]');
  55  |     const isVisibleDesktop = await mainContent.isVisible().catch(() => false);
  56  | 
  57  |     // Test at tablet (768px)
  58  |     await page.setViewportSize({ width: 768, height: 1024 });
  59  |     const isVisibleTablet = await mainContent.isVisible().catch(() => false);
  60  | 
  61  |     // Test at mobile (375px)
  62  |     await page.setViewportSize({ width: 375, height: 667 });
  63  |     const isVisibleMobile = await mainContent.isVisible().catch(() => false);
  64  | 
  65  |     console.log(`Desktop: ${isVisibleDesktop}, Tablet: ${isVisibleTablet}, Mobile: ${isVisibleMobile}`);
  66  |   });
  67  | 
  68  |   test('04: Orders page loads and shows empty state with demo data button', async ({ page }) => {
  69  |     await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  70  | 
  71  |     // Check for empty state or load button
  72  |     const demoButton = page.locator('button:has-text("Load Demo Data"), button:has-text("Seed")');
  73  |     const noOrdersText = page.locator('text=No orders found');
  74  | 
  75  |     const buttonVisible = await demoButton.isVisible().catch(() => false);
  76  |     const noOrdersVisible = await noOrdersText.isVisible().catch(() => false);
  77  | 
  78  |     if (buttonVisible) {
  79  |       console.log('✓ Orders page shows "Load Demo Data" button');
  80  |       expect(demoButton).toBeVisible();
  81  |     } else if (noOrdersVisible) {
  82  |       console.log('✓ Orders page shows "No orders found" message');
  83  |       expect(noOrdersText).toBeVisible();
  84  |     } else {
  85  |       console.log('✓ Orders page loaded (table or content visible)');
  86  |     }
  87  |   });
  88  | 
  89  |   test('05: Dialog components accessible and closeable', async ({ page }) => {
  90  |     await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  91  | 
  92  |     // Look for any modal/dialog trigger buttons
  93  |     const modalTriggers = page.locator('button').all();
  94  |     const triggers = await modalTriggers;
  95  | 
  96  |     if (triggers.length > 0) {
  97  |       // Try clicking first button that might open a modal
  98  |       await triggers[0].click().catch(() => {});
  99  | 
  100 |       // Check for dialog close button
  101 |       const closeButton = page.locator('button[aria-label="Close"], button:has(svg[class*="x-"]), [class*="close"]');
  102 |       const isVisible = await closeButton.isVisible().catch(() => false);
  103 | 
  104 |       if (isVisible) {
  105 |         console.log('✓ Dialog close button found');
  106 |         await closeButton.click().catch(() => {});
```