const { test } = require('node:test');
const assert = require('node:assert/strict');
const Timeline = require('../dist/touch-timeline.js');
const events = [
  { type: 'contact', phase: .10 }, { type: 'contact', phase: .12 },
  { type: 'absorb', phase: .20 }, { type: 'release', phase: .40 },
  { type: 'break', phase: .45 }
];

test('large jumps show one event per type and finish within the existing deadline', () => {
  const timeline = new Timeline(events);
  const samples = [0, 16, 32, 48, 64].map(now => timeline.tick(.8, now));
  assert.deepEqual(samples, [.12, .20, .40, .45, .8]);
  assert.equal(timeline.pending, false);
});

test('reverse scrolling visits the same event phases in reverse order', () => {
  const timeline = new Timeline(events);
  timeline.reset(.8);
  const samples = [0, 16, 32, 48, 64].map(now => timeline.tick(.1, now));
  assert.deepEqual(samples, [.45, .40, .20, .12, .1]);
  assert.equal(timeline.pending, false);
});

test('a sudden reversal discards forward events without overshooting', () => {
  const timeline = new Timeline(events);
  assert.equal(timeline.tick(.8, 0), .12);
  assert.equal(timeline.tick(0, 16), .1);
  assert.equal(timeline.tick(0, 32), 0);
  assert.equal(timeline.pending, false);
});

test('a delayed frame catches up rather than extending deferred animation', () => {
  const timeline = new Timeline(events);
  timeline.tick(.8, 0);
  assert.equal(timeline.tick(.8, 200), .8);
  assert.equal(timeline.pending, false);
});

test('leaving the chapter cancels pending events and small movements remain direct', () => {
  const timeline = new Timeline(events);
  timeline.tick(.8, 0);
  timeline.reset(.7);
  assert.equal(timeline.pending, false);
  assert.equal(timeline.queue.length, 0);
  assert.equal(timeline.tick(.705, 16), .705);
});
