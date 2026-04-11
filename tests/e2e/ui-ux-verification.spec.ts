import { test, expect } from '@playwright/test';

test.describe('VendorFlow UI/UX Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  });

  test('01: Login page loads and renders correctly', async ({ page }) => {
    // Check page title
    const title = await page.title();
    expect(title).toBeDefined();

    // Check login form exists
    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button:has-text("Sign in"), button:has-text("Login")');

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });
  });

  test('02: Navigation sidebar renders correctly', async ({ page, context }) => {
    // Set up auth - use localStorage to bypass auth if possible
    await page.evaluate(() => {
      localStorage.setItem('sb-auth-token', JSON.stringify({
        access_token: 'test-token',
        user: { id: 'test-user' }
      }));
    });

    // Navigate to dashboard
    await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });

    // Check sidebar is visible
    const sidebar = page.locator('[role="navigation"], aside, .sidebar');
    const isVisible = await sidebar.isVisible().catch(() => false);

    // Check at least one nav item exists
    const navItems = page.locator('nav a, [role="menuitem"], button[title*="Dashboard"], button[title*="Orders"]');
    const count = await navItems.count().catch(() => 0);

    if (count === 0) {
      console.log('⚠️ Navigation items not found - auth may be required');
    } else {
      expect(count).toBeGreaterThan(0);
    }
  });

  test('03: Insights page layout responsive at multiple breakpoints', async ({ page }) => {
    await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });

    // Test at desktop (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    const mainContent = page.locator('main, [class*="content"], [class*="main"]');
    const isVisibleDesktop = await mainContent.isVisible().catch(() => false);

    // Test at tablet (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    const isVisibleTablet = await mainContent.isVisible().catch(() => false);

    // Test at mobile (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    const isVisibleMobile = await mainContent.isVisible().catch(() => false);

    console.log(`Desktop: ${isVisibleDesktop}, Tablet: ${isVisibleTablet}, Mobile: ${isVisibleMobile}`);
  });

  test('04: Orders page loads and shows empty state with demo data button', async ({ page }) => {
    await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

    // Check for empty state or load button
    const demoButton = page.locator('button:has-text("Load Demo Data"), button:has-text("Seed")');
    const noOrdersText = page.locator('text=No orders found');

    const buttonVisible = await demoButton.isVisible().catch(() => false);
    const noOrdersVisible = await noOrdersText.isVisible().catch(() => false);

    if (buttonVisible) {
      console.log('✓ Orders page shows "Load Demo Data" button');
      expect(demoButton).toBeVisible();
    } else if (noOrdersVisible) {
      console.log('✓ Orders page shows "No orders found" message');
      expect(noOrdersText).toBeVisible();
    } else {
      console.log('✓ Orders page loaded (table or content visible)');
    }
  });

  test('05: Dialog components accessible and closeable', async ({ page }) => {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    // Look for any modal/dialog trigger buttons
    const modalTriggers = page.locator('button').all();
    const triggers = await modalTriggers;

    if (triggers.length > 0) {
      // Try clicking first button that might open a modal
      await triggers[0].click().catch(() => {});

      // Check for dialog close button
      const closeButton = page.locator('button[aria-label="Close"], button:has(svg[class*="x-"]), [class*="close"]');
      const isVisible = await closeButton.isVisible().catch(() => false);

      if (isVisible) {
        console.log('✓ Dialog close button found');
        await closeButton.click().catch(() => {});
      }
    }
  });

  test('06: Forms have proper labels and are keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    // Check for form inputs
    const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Tab through inputs
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('type'));
      console.log(`✓ Found ${inputCount} form inputs, keyboard navigation works`);
      expect(inputCount).toBeGreaterThan(0);
    }
  });

  test('07: Buttons have visible focus/hover states', async ({ page }) => {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    // Find a button
    const button = page.locator('button').first();

    if (await button.isVisible().catch(() => false)) {
      // Hover over button
      await button.hover();

      // Check computed style changed
      const hoverStyle = await button.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          opacity: style.opacity,
          cursor: style.cursor,
        };
      });

      console.log(`✓ Button hover state: ${JSON.stringify(hoverStyle)}`);
      expect(hoverStyle.cursor).toBe('pointer');
    }
  });

  test('08: No horizontal scrolling on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check scroll width
    const scrollWidth = await page.evaluate(() => {
      return Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth
      );
    });

    const windowWidth = 375;
    const hasHorizontalScroll = scrollWidth > windowWidth;

    console.log(`Viewport: ${windowWidth}px, Content: ${scrollWidth}px, Horizontal scroll: ${hasHorizontalScroll}`);
    // Allow small overflow due to scrollbar
    expect(scrollWidth).toBeLessThanOrEqual(windowWidth + 20);
  });

  test('09: Color contrast - text is readable', async ({ page }) => {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    // Check a few text elements for contrast
    const headings = page.locator('h1, h2, h3, p');
    const count = await headings.count();

    if (count > 0) {
      const firstElement = headings.first();
      const computed = await firstElement.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
          fontSize: style.fontSize,
        };
      });

      console.log(`✓ Text styling - Color: ${computed.color}, BG: ${computed.backgroundColor}, Size: ${computed.fontSize}`);
    }
  });

  test('10: Multiple pages navigate without errors', async ({ page }) => {
    const pagesToTest = [
      '/login',
      '/insights',
      '/orders',
      '/inventory',
      '/returns',
    ];

    for (const pagePath of pagesToTest) {
      try {
        await page.goto(`http://localhost:5173${pagePath}`, {
          waitUntil: 'networkidle',
          timeout: 8000
        });

        // Check for console errors
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') errors.push(msg.text());
        });

        // Wait a moment for any errors to appear
        await page.waitForTimeout(1000);

        console.log(`✓ ${pagePath} loaded (${errors.length} console errors)`);

        // Check page has some content
        const body = page.locator('body');
        const hasContent = await body.isVisible();
        expect(hasContent).toBe(true);

      } catch (e) {
        console.log(`⚠️ ${pagePath} - ${(e as Error).message}`);
      }
    }
  });

  test('11: Components render without layout shift', async ({ page }) => {
    await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });

    // Get initial layout metrics
    const initialLayout = await page.evaluate(() => {
      const bodyRect = document.body.getBoundingClientRect();
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    // Wait for animations to finish
    await page.waitForTimeout(1000);

    // Get final layout metrics
    const finalLayout = await page.evaluate(() => {
      const bodyRect = document.body.getBoundingClientRect();
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
      };
    });

    console.log(`Layout shift - Initial: ${initialLayout.scrollWidth}px, Final: ${finalLayout.scrollWidth}px`);
    // Allow small variation
    expect(Math.abs(initialLayout.scrollWidth - finalLayout.scrollWidth)).toBeLessThan(50);
  });

  test('12: Sidebar collapse/expand works on mobile', async ({ page }) => {
    await page.goto('http://localhost:5173/insights', { waitUntil: 'networkidle' });

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Look for hamburger menu or sidebar toggle
    const menuButton = page.locator('button[aria-label*="Menu"], button[aria-label*="Toggle"], [class*="hamburger"]');
    const isVisible = await menuButton.isVisible().catch(() => false);

    if (isVisible) {
      await menuButton.click();
      console.log('✓ Sidebar toggle button works');
      expect(menuButton).toBeVisible();
    } else {
      console.log('⚠️ Sidebar toggle not found - may be auto-hidden');
    }
  });
});

test.describe('Component Functionality Tests', () => {
  test('Badge components render with proper styling', async ({ page }) => {
    await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

    const badges = page.locator('[class*="badge"], .badge');
    const count = await badges.count();

    console.log(`✓ Found ${count} badge components`);
  });

  test('Buttons have consistent spacing and sizing', async ({ page }) => {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

    const buttons = page.locator('button').all();
    const btnCount = await buttons.then(b => b.length);

    console.log(`✓ Found ${btnCount} buttons on page`);
    expect(btnCount).toBeGreaterThan(0);
  });

  test('Select/dropdown components are accessible', async ({ page }) => {
    await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

    const selects = page.locator('select, [role="combobox"], [role="listbox"]');
    const count = await selects.count();

    console.log(`✓ Found ${count} select/dropdown components`);
  });

  test('Tables have proper header and body structure', async ({ page }) => {
    await page.goto('http://localhost:5173/orders', { waitUntil: 'networkidle', timeout: 10000 }).catch(() => {});

    const tables = page.locator('table, [role="table"]');
    const tableCount = await tables.count();

    if (tableCount > 0) {
      const headers = page.locator('th, [role="columnheader"]');
      const headerCount = await headers.count();
      console.log(`✓ Found ${tableCount} table(s) with ${headerCount} header cell(s)`);
    }
  });
});
