const { test, expect } = require('@playwright/test');
const { intro: leaderIntro, people: leaders } = require('../../content/leaders.json');

async function ready(page, hash) {
  await page.goto('/' + hash);
  await expect(page.locator('html')).toHaveAttribute('data-state', 'ready');
}
async function stablePosition(page) {
  let previous = -1, repeats = 0;
  await expect.poll(async () => {
    const value = await page.locator('.story-shell').evaluate(shell => shell.scrollLeft);
    repeats = value === previous ? repeats + 1 : 0;
    previous = value;
    return repeats;
  }, { intervals: [50, 50, 100, 100] }).toBeGreaterThanOrEqual(3);
}
async function touchOnly(page) {
  test.skip(await page.locator('html').getAttribute('data-input') !== 'touch', 'Native resize anchoring applies to touch input');
}
const memberPhase = page => page.evaluate(() => {
  const shell = document.querySelector('.story-shell');
  const hold = document.querySelector('.native-chapter[data-stage="members"]');
  const box = hold.getBoundingClientRect();
  const start = box.left - shell.getBoundingClientRect().left + shell.scrollLeft;
  return (shell.scrollLeft - start) / (box.width - shell.clientWidth);
});

test('member progress survives portrait to landscape and back', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await ready(page, '#members');
  await touchOnly(page);
  await expect(page.locator('.chapter-name')).toHaveText('汇聚成 2n');
  await stablePosition(page);
  await page.evaluate(() => {
    const shell = document.querySelector('.story-shell');
    const box = document.querySelector('.native-chapter[data-stage="members"]').getBoundingClientRect();
    const start = box.left - shell.getBoundingClientRect().left + shell.scrollLeft;
    shell.scrollTo({ left: start + (box.width - shell.clientWidth) * .6, behavior: 'instant' });
  });
  await expect.poll(() => memberPhase(page)).toBeCloseTo(.6, 2);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const before = await memberPhase(page);
  for (const viewport of [{ width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--view-height'))).toBe(viewport.height + 'px');
    await expect.poll(() => memberPhase(page)).toBeCloseTo(before, 2);
    await expect(page.locator('.chapter-name')).toHaveText('汇聚成 2n');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /maximum-scale=1, user-scalable=no/);
  }
});

test('the same management card stays at the same fractional position on rotation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '#leaders');
  await touchOnly(page);
  const index = Math.min(1, leaders.length - 1);
  await page.evaluate(index => {
    const shell = document.querySelector('.story-shell');
    const box = document.querySelectorAll('.leader-card')[index].getBoundingClientRect();
    const start = box.left - shell.getBoundingClientRect().left + shell.scrollLeft;
    shell.scrollTo({ left: start + box.width * .35, behavior: 'instant' });
  }, index);
  const fraction = () => page.evaluate(index => {
    const shell = document.querySelector('.story-shell');
    const box = document.querySelectorAll('.leader-card')[index].getBoundingClientRect();
    return (shell.getBoundingClientRect().left - box.left) / box.width;
  }, index);
  await expect.poll(fraction).toBeCloseTo(.35, 2);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect.poll(fraction).toBeCloseTo(.35, 2);
  await expect(page.locator('.chapter-name')).toHaveText(leaderIntro.title);
});

test('narrow and landscape layouts keep root overflow contained and endpoints reachable', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await ready(page, '');
  for (const viewport of [{ width: 320, height: 680 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--view-height'))).toBe(viewport.height + 'px');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.keyboard.press('End');
    await expect(page.locator('.chapter-count b')).toHaveText('11');
    await page.keyboard.press('Home');
    await expect(page.locator('.chapter-count b')).toHaveText('01');
  }
});
