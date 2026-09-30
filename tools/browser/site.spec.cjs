const { test, expect } = require('@playwright/test');
const { readFileSync } = require('node:fs');
const { readContent } = require('../leaders-content.cjs');
const people = readContent(readFileSync(require.resolve('../../content/leaders.json'), 'utf8')).people;

async function settle(page) {
  await page.evaluate(() => new Promise(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function ready(page, path = '/') {
  await page.goto(path);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await settle(page);
}

test('startup, chapter navigation, and returning to opening work', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  await expect(page.locator('html')).toHaveClass(/is-enhanced/);
  await expect(page.locator('html')).toHaveAttribute('data-assets', 'complete');
  await expect(page.locator('.chapter-count b')).toHaveText('01');
  await page.keyboard.press('PageDown');
  await expect(page.locator('.chapter-name')).toHaveText('花园');
  await page.keyboard.press('End');
  await expect(page.locator('.chapter-count b')).toHaveText('11');
  await page.keyboard.press('Home');
  await expect(page.locator('.chapter-count b')).toHaveText('01');
  await expect(page.locator('video')).toHaveAttribute('preload', 'none');
  expect(errors).toEqual([]);
});

test('skip opening unlocks the story while motion is enabled', async ({ page }) => {
  // Keep the click inside the early intro, before its curtain clips this button.
  await page.clock.install({ time: new Date('2026-09-30T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-30T00:00:00.100Z'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'intro');
  await page.locator('.skip-intro').click();
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.intro-screen')).toBeHidden();
  await expect(page.locator('.site-header')).not.toHaveAttribute('inert', '');
});

test('member animation and returning to opening run without frame errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page, '/#members');
  await expect(page.locator('.member-fusion path').first()).toHaveAttribute('d', /^M/);
  await page.keyboard.press('ArrowRight');
  await settle(page);
  const outline = await page.locator('.member-fusion path').first().getAttribute('d');
  expect(outline).not.toMatch(/NaN|Infinity/);
  await page.keyboard.press('End');
  await expect(page.locator('.chapter-count b')).toHaveText('11');
  await page.keyboard.press('Home');
  await expect(page.locator('.chapter-count b')).toHaveText('01');
  await settle(page);
  expect(errors).toEqual([]);
});

test('touch viewport and cancelable Safari gestures keep zoom disabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const input = await page.locator('html').getAttribute('data-input');
  test.skip(input !== 'touch', 'Restriction applies to the touch input path');
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /maximum-scale=1, user-scalable=no/);
  const canceled = await page.evaluate(() => ['gesturestart', 'gesturechange'].map(type => {
    const event = new Event(type, { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
  }));
  expect(canceled).toEqual([true, true]);
});

test('script failure restores readable content', async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.setTimeout.bind(window);
    window.setTimeout = (callback, delay, ...args) =>
      original(callback, delay === 12000 ? 500 : delay, ...args);
  });
  await page.route('**/app.js*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'fallback');
  await expect(page.locator('html')).not.toHaveClass(/is-enhanced/);
  await expect(page.locator('.intro-screen')).toBeHidden();
  await expect(page.locator('.leader-list')).toContainText(people[0].name);
  await expect(page.locator('.leader-card')).toHaveCount(people.length);
});

test('management content remains present without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  try {
    await page.goto('http://127.0.0.1:4173/');
    await expect(page.locator('.leader-list')).toContainText(people[people.length - 1].name);
    await expect(page.locator('.leader-card')).toHaveCount(people.length);
    await expect(page.locator('.intro-screen')).toBeHidden();
  } finally { await context.close(); }
});

test('desert text retains dark contrast with optimized image paths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page);
  const styles = await page.locator('[data-biome="desert"] h2').evaluate(node => {
    const style = getComputedStyle(node);
    return { color: style.color, expected: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() };
  });
  expect(styles.color).toBe('rgb(11, 13, 16)');
});

const visualProperties = ['color', 'backgroundColor', 'fontFamily', 'fontSize', 'lineHeight', 'padding', 'margin', 'borderColor', 'borderWidth', 'position', 'display', 'zIndex', 'opacity', 'transform'];
const visualSelectors = ['.site-header', '.brand-visual', '.hero-eyebrow', '.biome-copy h2', '.biome-copy p', '.section-intro', '.leader-card', '.leader-card h3', '.members', '.anniversary-title', '.film', '.film h2', '.closing', '.closing h2'];
async function styles(page) {
  return page.evaluate(({ selectors, properties }) => selectors.map(selector => ({
    selector,
    nodes: [...document.querySelectorAll(selector)].filter((_, index) => !selector.startsWith('.leader-card') || index === 0).map(node => {
      const computed = getComputedStyle(node);
      return Object.fromEntries(properties.map(property => [property, computed[property]]));
    })
  })), { selectors: visualSelectors, properties: visualProperties });
}

for (const chapter of ['', '#biomes', '#leaders', '#members', '#film']) {
  test('layout and typography match previous branch at ' + (chapter || 'opening'), async ({ page, context }) => {
    test.skip(!process.env.BASELINE_URL, 'Comparison requires the previous branch preview');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await ready(page, '/' + chapter);
    const baseline = await context.newPage();
    try {
      await baseline.emulateMedia({ reducedMotion: 'reduce' });
      await ready(baseline, process.env.BASELINE_URL + '/' + chapter);
      expect(await styles(page)).toEqual(await styles(baseline));
    } finally { await baseline.close(); }
  });
}
