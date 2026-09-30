const { test } = require('node:test');
const assert = require('node:assert/strict');
const N = require('../dist/navigation.js');

test('adjacent stops honor the existing four-pixel tolerance in both directions', () => {
  const stops = [0, 100, 200, 300];
  assert.equal(N.adjacentStop(stops, 96, 1), 200);
  assert.equal(N.adjacentStop(stops, 95, 1), 100);
  assert.equal(N.adjacentStop(stops, 104, -1), 0);
  assert.equal(N.adjacentStop(stops, 105, -1), 100);
  assert.equal(N.adjacentStop(stops, 300, 1), undefined);
  assert.equal(N.adjacentStop([], 0, -1), undefined);
});

function navigation(state) {
  const calls = [];
  let position = 0;
  const api = N.create({
    getState: () => state,
    storyPosition: () => position,
    scrollStory: (value, behavior) => { position = value; calls.push([value, behavior]); },
    scrollForX: x => 100 + x,
    schedule: () => calls.push('wake'),
    fallback: value => calls.push(['fallback', value])
  });
  return { ...api, calls };
}

test('destinations use fresh geometry and clamp to the current story extent', () => {
  const state = { active: true, ready: true, reduced: false, max: 1000, stops: [0, 100, 500], geometry: [{ panel: { id: 'members' }, x: 500 }] };
  const api = navigation(state);
  api.goTo('members');
  assert.deepEqual(api.calls, [[600, 'smooth'], 'wake']);
  state.reduced = true;
  state.max = 400;
  api.goTo(2000);
  api.goTo(-10);
  assert.deepEqual(api.calls.slice(2), [[400, 'instant'], 'wake', [0, 'instant'], 'wake']);
  api.nextStop(1);
  assert.deepEqual(api.calls.slice(-2), [[100, 'instant'], 'wake']);
});

test('navigation stays locked during intro and uses ordinary fallback scrolling after failure', () => {
  const state = { active: true, ready: false };
  const api = navigation(state);
  api.goTo('members');
  assert.deepEqual(api.calls, []);
  state.active = false;
  api.goTo('members');
  assert.deepEqual(api.calls, [['fallback', 'members']]);
});

test('orientation changes preserve held chapter phase instead of absolute pixels', () => {
  const target = {};
  const old = [{ target, x: 4000, width: 10390, hold: true }];
  const anchor = N.captureAnchor(old, 10000, 390);
  assert.equal(anchor.ratio, .6);
  const updated = new Map([[target, { x: 9000, width: 6844 }]]);
  const restored = N.restoreAnchor(anchor, updated, 844, 10000);
  assert.equal(restored, 12600);
  assert.equal((restored - 9000) / 6000, .6);
  assert.notEqual((10000 - 9000) / 6000, .6, 'The previous absolute position loses the phase');
});

test('management card anchors retain their fractional position', () => {
  const card = {}, panel = {};
  const anchor = N.captureAnchor([
    { target: card, x: 1500, width: 390 },
    { target: panel, x: 1000, width: 2340 }
  ], 1695, 390);
  assert.equal(anchor.target, card);
  assert.equal(anchor.ratio, .5);
  assert.equal(N.restoreAnchor(anchor, new Map([[card, { x: 2500, width: 844 }]]), 844, 1695), 2922);
});

test('missing resize anchors fall back to the previous position', () => {
  assert.equal(N.captureAnchor([], 100, 390), null);
  assert.equal(N.restoreAnchor(null, new Map(), 844, 100), 100);
  assert.equal(N.restoreAnchor({ target: {} }, new Map(), 844, 100), 100);
});
