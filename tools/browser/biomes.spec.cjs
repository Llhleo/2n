const { test, expect } = require('@playwright/test');
const baseline = process.env.BIOME_BASELINE_URL || '';
test.beforeEach(() => test.fail(!!baseline, 'The old reveal and background paths must fail these checks.'));

test('touch biome text stays readable during rapid jumps before observer delivery', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(baseline + '/#biomes');
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
  test.skip(await page.locator('html').getAttribute('data-input') !== 'touch', 'Native momentum applies to touch input');
  const readings = await page.evaluate(() => {
    const shell = document.querySelector('.story-shell');
    const panels = [...document.querySelectorAll('.biome')];
    const positions = panels.map(panel => panel.getBoundingClientRect().left - shell.getBoundingClientRect().left + shell.scrollLeft);
    const result = [];
    // Keep every jump and style read in one task: no observer can reveal the next panel in between.
    for (const index of [4, 1, 3, 0, 2, 4, 0]) {
      shell.scrollLeft = positions[index];
      result.push(...[...panels[index].querySelectorAll('.biome-copy>*')].map(node => ({
        text: node.textContent,
        opacity: Number(getComputedStyle(node).opacity),
        transform: getComputedStyle(node).transform,
        parentOpacity: Number(getComputedStyle(node.parentElement).opacity)
      })));
    }
    return result;
  });
  for (const reading of readings) {
    expect(reading.text.trim()).not.toBe('');
    expect(reading.opacity).toBe(1);
    expect(reading.parentOpacity).toBe(1);
    expect(reading.transform).toBe('none');
  }
  await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /maximum-scale=1, user-scalable=no/);
});

test('all five displayed biome images are eager and decoded before complete startup', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(baseline + '/#biomes');
  await expect(page.locator('html')).toHaveAttribute('data-assets', 'complete');
  const images = page.locator('.biome-image');
  await expect(images).toHaveCount(5, { timeout: 1500 });
  expect(await images.evaluateAll(nodes => nodes.every(image =>
    image.complete && image.naturalWidth > 0 && image.loading === 'eager' &&
    image.getBoundingClientRect().width > 0 && image.getBoundingClientRect().height > 0))).toBe(true);
});

test('slow biome images can appear after the boot deadline without restarting the story', async ({ page }) => {
  await page.clock.install({ time: new Date('2026-09-30T00:00:00Z') });
  await page.clock.pauseAt(new Date('2026-09-30T00:00:00.100Z'));
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  await page.route(/\/assets\/(garden|desert|ocean|jungle|hell)\.(png|webp)(\?|$)/, async route => {
    await gate;
    await route.continue();
  });
  try {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(baseline + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.biome-image')).toHaveCount(5, { timeout: 1500 });
    await page.clock.runFor(4600);
    await expect(page.locator('html')).toHaveAttribute('data-assets', 'partial');
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
    release();
    await page.waitForLoadState('networkidle');
    await expect.poll(() => page.locator('.biome-image').evaluateAll(nodes =>
      nodes.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
    await expect(page.locator('html')).toHaveClass(/is-enhanced/);
  } finally { release(); await page.unrouteAll({ behavior: 'wait' }); }
});
