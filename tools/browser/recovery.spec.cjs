const { test, expect } = require('@playwright/test');
const baseline = process.env.REGRESSION_BASELINE_URL || '';

test.beforeEach(() => {
  test.fail(!!baseline, 'These recovery regressions must fail on the previous implementation.');
});

test('fallback ignores queued resize and restored-page events', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.clock.install({ time: new Date('2026-09-30T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-30T00:00:00.100Z'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(baseline + '/?perf=1#members');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await page.clock.runFor(500);
  const before = await page.locator('html').evaluate(root => root.style.getPropertyValue('--view-height'));
  const viewport = page.viewportSize();
  await page.setViewportSize({ width: viewport.width + 200, height: viewport.height + 200 });
  await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    window.twoNFallback();
  });
  await page.clock.runFor(1000);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('html')).toHaveAttribute('data-state', 'fallback');
  await expect(page.locator('html')).not.toHaveClass(/is-enhanced/);
  await expect(page.locator('.native-chapter')).toHaveCount(0);
  await expect(page.locator('.brand-anchor')).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.locator('html').evaluate(root => root.style.getPropertyValue('--view-height'))).toBe(before);
});

for (const action of ['Escape', 'skip-link']) {
  test('dismissing during image loading with ' + action + ' survives late completion', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    await page.route(/\/assets\/(garden|desert|ocean|jungle|hell)\.(png|webp)(\?|$)/, async route => {
      await gate;
      await route.continue();
    });
    try {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(baseline + '/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveClass(/is-booting/);
      if (action === 'Escape') await page.keyboard.press('Escape');
      else {
        await page.locator('.skip-link').focus();
        await page.keyboard.press('Enter');
      }
      await expect(page.locator('html')).toHaveAttribute('data-state', 'fallback', { timeout: 1500 });
      await expect(page.locator('.intro-screen')).toBeHidden();
      release();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('html')).toHaveAttribute('data-state', 'fallback');
      await expect(page.locator('html')).not.toHaveClass(/is-enhanced|is-intro-locked/);
      await expect(page.locator('.native-chapter')).toHaveCount(0);
      await expect(page.locator('.leader-list')).toContainText('awdc');
      expect(errors).toEqual([]);
    } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
  });
}
