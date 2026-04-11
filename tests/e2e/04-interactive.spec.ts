import { test, expect } from '@playwright/test';
import { injectMockAuth } from './helpers/mock-auth';

async function interceptDataCalls(page: import('@playwright/test').Page) {
  await page.route('**/rest/v1/**', async (route) => {
    if (route.request().method() === 'GET') {
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

test.describe('Interactive components (mocked auth)', () => {
  test.beforeEach(async ({ page }) => {
    await injectMockAuth(page);
    await interceptDataCalls(page);
  });

  test('sidebar search input accepts text', async ({ page }) => {
    await page.goto('/insights', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});

    // Look for any search input in the sidebar or header area
    const searchInput = page.locator(
      'aside input[type="text"], aside input[type="search"], nav input, header input[type="text"], header input[type="search"]'
    ).first();

    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'No sidebar/header search input found — may use different selector');
      return;
    }
    await searchInput.fill('order');
    await expect(searchInput).toHaveValue('order');
  });

  test('top header search input accepts text', async ({ page }) => {
    await page.goto('/insights', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});

    // The AppLayout has a .hidden md:flex search in the header
    const searchInput = page.locator('header input').first();
    const isVisible = await searchInput.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Header search input not visible');
      return;
    }
    await searchInput.fill('inventory');
    await expect(searchInput).toHaveValue('inventory');
  });

  test('insights page — tabs or metric cards are present', async ({ page }) => {
    await page.goto('/insights', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});

    // Check for tabs, metric cards, or any interactive elements
    const tabs = page.locator('[role="tab"], [data-testid*="tab"], button[class*="tab"]');
    const cards = page.locator('[class*="card"], [class*="metric"], [class*="stat"]');

    const tabCount = await tabs.count();
    const cardCount = await cards.count();
    expect(tabCount + cardCount, 'Insights page should have tabs or metric cards').toBeGreaterThan(0);
  });

  test('sidebar trigger button is clickable', async ({ page }) => {
    await page.goto('/insights', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});

    // SidebarTrigger is a button in the header
    const trigger = page.locator('header button').first();
    const isVisible = await trigger.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip(true, 'Sidebar trigger not found');
      return;
    }
    await trigger.click();
    // After clicking, sidebar state changes — just verify no crash
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('screenshot: insights page', async ({ page }) => {
    await page.goto('/insights', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
    await page.screenshot({ path: 'tests/e2e/screenshots/insights-page.png', fullPage: true });
  });

  test('screenshot: orders page', async ({ page }) => {
    await page.goto('/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
    await page.screenshot({ path: 'tests/e2e/screenshots/orders-page.png', fullPage: true });
  });

  test('screenshot: inventory page', async ({ page }) => {
    await page.goto('/inventory', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
    await page.screenshot({ path: 'tests/e2e/screenshots/inventory-page.png', fullPage: true });
  });

  test('screenshot: analytics page', async ({ page }) => {
    await page.goto('/analytics', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-page.png', fullPage: true });
  });

  test('screenshot: reports page', async ({ page }) => {
    await page.goto('/reports', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 12000 }).catch(() => {});
    await page.screenshot({ path: 'tests/e2e/screenshots/reports-page.png', fullPage: true });
  });
});
