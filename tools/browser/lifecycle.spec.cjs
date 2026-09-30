const { test, expect } = require('@playwright/test');
const { intro: leaderIntro, people: leaders } = require('../../content/leaders.json');

async function clock(page) {
  await page.clock.install({ time: new Date('2026-09-30T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-30T00:00:00.100Z'));
}
const frames = page => page.evaluate(() => window.TwoNPerf.values.frames);
async function stableOutline(page) {
  let previous = null, repeats = 0;
  await expect.poll(async () => {
    const value = await page.locator('.member-fusion path').first().getAttribute('d');
    repeats = value === previous ? repeats + 1 : 0;
    previous = value;
    return repeats;
  }, { intervals: [50, 50, 100, 100] }).toBeGreaterThanOrEqual(3);
  return previous;
}

test('a simulated long background pause stops frames and resumes the unfinished intro', async ({ page }) => {
  await clock(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?perf=1');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'intro');
  await page.clock.runFor(1000);
  const before = await frames(page);
  expect(before).toBeGreaterThan(0);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(20000);
  expect(await frames(page)).toBe(before);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'intro');
  await expect(page.locator('html')).toHaveClass(/is-enhanced/);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await page.clock.runFor(1000);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'intro');
  await page.clock.runFor(4000);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
});

test('film is idle while the opening still schedules its intended wave animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?perf=1#film');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.chapter-count b')).toHaveText('10');
  let last = -1, repeats = 0;
  await expect.poll(async () => {
    const value = await frames(page);
    repeats = value === last ? repeats + 1 : 0;
    last = value;
    return repeats;
  }, { intervals: [100, 100, 200, 200] }).toBeGreaterThanOrEqual(3);
  const idle = await frames(page);
  // This is a measured idle interval using the browser's actual scroll clock.
  await page.waitForTimeout(500);
  expect(await frames(page)).toBe(idle);
  await page.keyboard.press('Home');
  await expect(page.locator('.chapter-count b')).toHaveText('01');
  const opening = await frames(page);
  await page.waitForTimeout(200);
  expect(await frames(page)).toBeGreaterThan(opening);
});

test('live fallback removes enhanced stages and cancels pending animation', async ({ page }) => {
  await clock(page);
  await page.goto('/?perf=1#members');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await page.clock.runFor(1000);
  await page.evaluate(() => window.twoNFallback());
  await expect(page.locator('html')).toHaveAttribute('data-state', 'fallback');
  await expect(page.locator('.native-chapter')).toHaveCount(0);
  await expect(page.locator('.brand-anchor')).toHaveCount(0);
  await expect(page.locator('.member-fusion')).toBeHidden();
  await expect(page.locator('.leader-list')).toContainText(leaders[0].name);
  const stopped = await frames(page);
  await page.clock.runFor(2000);
  expect(await frames(page)).toBe(stopped);
});

test('simulated pageshow restoration keeps a single set of stages and the reading position', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#leaders');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.chapter-name')).toHaveText(leaderIntro.title);
  for (let i = 0; i < 3; i++)
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await expect(page.locator('.chapter-name')).toHaveText(leaderIntro.title);
  await expect(page.locator('.brand-visual')).toHaveCount(1);
  await expect(page.locator('.member-fusion')).toHaveCount(1);
  const input = await page.locator('html').getAttribute('data-input');
  await expect(page.locator('.native-chapter')).toHaveCount(input === 'touch' ? 2 : 0);
});

test('returning to the same member stop restores the same liquid outline', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?perf=1#members');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.chapter-name')).toHaveText('汇聚成 2n');
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => window.TwoNPerf.values.liquidPhase)).toBeCloseTo(.3, 3);
  const outline = await stableOutline(page);
  await page.keyboard.press('PageDown');
  await expect.poll(() => page.evaluate(() => window.TwoNPerf.values.liquidPhase)).toBeCloseTo(.47, 3);
  await page.keyboard.press('PageUp');
  await expect.poll(() => page.evaluate(() => window.TwoNPerf.values.liquidPhase)).toBeCloseTo(.3, 3);
  // Wait for the actual SVG write, rather than just observing a near-target phase.
  await expect(page.locator('.member-fusion path').first()).toHaveAttribute('d', outline);
  expect(errors).toEqual([]);
});
