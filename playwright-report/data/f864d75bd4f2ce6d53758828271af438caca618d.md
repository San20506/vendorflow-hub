# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui-ux-verification.spec.ts >> Component Functionality Tests >> Buttons have consistent spacing and sizing
- Location: tests/e2e/ui-ux-verification.spec.ts:295:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
Call log:
  - navigating to "http://localhost:5173/login", waiting until "networkidle"

```

# Test source

```ts
  196 |   test('10: Multiple pages navigate without errors', async ({ page }) => {
  197 |     const pagesToTest = [
  198 |       '/login',
  199 |       '/insights',
  200 |       '/orders',
  201 |       '/inventory',
  202 |       '/returns',
  203 |     ];
  204 | 
  205 |     for (const pagePath of pagesToTest) {
  206 |       try {
  207 |         await page.goto(`http://localhost:5173${pagePath}`, {
  208 |           waitUntil: 'networkidle',
  209 |           timeout: 8000
  210 |         });
  211 | 
  212 |         // Check for console errors
  213 |         const errors: string[] = [];
  214 |         page.on('console', msg => {
  215 |           if (msg.type() === 'error') errors.push(msg.text());
  216 |         });
  217 | 
  218 |         // Wait a moment for any errors to appear
  219 |         await page.waitForTimeout(1000);
  220 | 
  221 |         console.log(`✓ ${pagePath} loaded (${errors.length} console errors)`);
  222 | 
  223 |         // Check page has some content
  224 |         const body = page.locator('body');
  225 |         const hasContent = await body.isVisible();
  226 |         expect(hasContent).toBe(true);
  227 | 
  228 |       } catch (e) {
  229 |         console.log(`⚠️ ${pagePath} - ${(e as Error).message}`);
  230 |       }
  231 |     }
  232 |   });
  233 | 
  234 |   test('11: Components render without layout shift', async ({ page }) => {
  235 |     await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });
  236 | 
  237 |     // Get initial layout metrics
  238 |     const initialLayout = await page.evaluate(() => {
  239 |       const bodyRect = document.body.getBoundingClientRect();
  240 |       return {
  241 |         width: window.innerWidth,
  242 |         height: window.innerHeight,
  243 |         scrollWidth: document.documentElement.scrollWidth,
  244 |       };
  245 |     });
  246 | 
  247 |     // Wait for animations to finish
  248 |     await page.waitForTimeout(1000);
  249 | 
  250 |     // Get final layout metrics
  251 |     const finalLayout = await page.evaluate(() => {
  252 |       const bodyRect = document.body.getBoundingClientRect();
  253 |       return {
  254 |         width: window.innerWidth,
  255 |         height: window.innerHeight,
  256 |         scrollWidth: document.documentElement.scrollWidth,
  257 |       };
  258 |     });
  259 | 
  260 |     console.log(`Layout shift - Initial: ${initialLayout.scrollWidth}px, Final: ${finalLayout.scrollWidth}px`);
  261 |     // Allow small variation
  262 |     expect(Math.abs(initialLayout.scrollWidth - finalLayout.scrollWidth)).toBeLessThan(50);
  263 |   });
  264 | 
  265 |   test('12: Sidebar collapse/expand works on mobile', async ({ page }) => {
  266 |     await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });
  267 | 
  268 |     // Set mobile viewport
  269 |     await page.setViewportSize({ width: 375, height: 667 });
  270 | 
  271 |     // Look for hamburger menu or sidebar toggle
  272 |     const menuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="Toggle"], [class*="hamburger"]');
  273 |     const isVisible = await menuButton.isVisible().catch(() => false);
  274 | 
  275 |     if (isVisible) {
  276 |       await menuButton.click();
  277 |       console.log('✓ Sidebar toggle button works');
  278 |       expect(menuButton).toBeVisible();
  279 |     } else {
  280 |       console.log('⚠️ Sidebar toggle not found - may be auto-hidden');
  281 |     }
  282 |   });
  283 | });
  284 | 
  285 | test.describe('Component Functionality Tests', () => {
  286 |   test('Badge components render with proper styling', async ({ page }) => {
  287 |     await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  288 | 
  289 |     const badges = page.locator('[class*="badge"], .badge');
  290 |     const count = await badges.count();
  291 | 
  292 |     console.log(`✓ Found ${count} badge components`);
  293 |   });
  294 | 
  295 |   test('Buttons have consistent spacing and sizing', async ({ page }) => {
> 296 |     await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/login
  297 | 
  298 |     const buttons = page.locator('button').all();
  299 |     const btnCount = await buttons.then(b => b.length);
  300 | 
  301 |     console.log(`✓ Found ${btnCount} buttons on page`);
  302 |     expect(btnCount).toBeGreaterThan(0);
  303 |   });
  304 | 
  305 |   test('Select/dropdown components are accessible', async ({ page }) => {
  306 |     await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  307 | 
  308 |     const selects = page.locator('select, [role="combobox"], [role="listbox"]');
  309 |     const count = await selects.count();
  310 | 
  311 |     console.log(`✓ Found ${count} select/dropdown components`);
  312 |   });
  313 | 
  314 |   test('Tables have proper header and body structure', async ({ page }) => {
  315 |     await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});
  316 | 
  317 |     const tables = page.locator('table, [role="table"]');
  318 |     const tableCount = await tables.count();
  319 | 
  320 |     if (tableCount > 0) {
  321 |       const headers = page.locator('th, [role="columnheader"]');
  322 |       const headerCount = await headers.count();
  323 |       console.log(`✓ Found ${tableCount} table(s) with ${headerCount} header cell(s)`);
  324 |     }
  325 |   });
  326 | });
  327 | 
```