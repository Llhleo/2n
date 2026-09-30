const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../dist/motion.js');
const L = require('../dist/liquid.js');

test('dense roster paths remain bounded and deterministic when scrolling backwards', () => {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    for (const count of [48, 49, 95]) {
      for (let i = 0; i < count; i++) {
        for (const phase of [0, .1, .3, .6, 1]) {
          const forward = M.memberPath(i, count, phase, width, height);
          M.memberPath(i, count, 1 - phase, width, height);
          assert.deepEqual(M.memberPath(i, count, phase, width, height), forward);
          for (const value of Object.values(forward)) assert.ok(Number.isFinite(value));
          for (const key of ['opacity', 'mix', 'absorbed', 'approach'])
            assert.ok(forward[key] >= 0 && forward[key] <= 1);
        }
      }
    }
  }
});

test('95 names gather while only 23 particles participate in the orbit handoff', () => {
  let visible = 0;
  for (let i = 0; i < 95; i++) {
    const particle = M.anniversaryParticle(i, 95, .6, 390, 844);
    if (i < 23) {
      assert.deepEqual(particle, M.anniversaryParticle(i, 23, .6, 390, 844));
      if (particle.opacity > 0) visible++;
    } else {
      assert.equal(particle.opacity, 0);
      assert.equal(particle.scale, 0);
    }
  }
  assert.equal(visible, 23);
});

test('full roster gather conserves area and is reversible on phone and desktop', () => {
  for (const [width, height] of [[390, 844], [1440, 900]]) {
    const plan = L.buildGather(M, 95, width, height, 240);
    for (const phase of [0, .07, .23, .51, .77, .93, 1]) {
      const state = L.gatherAt(M, plan, phase);
      const area = state.radius ** 2 + state.drops.reduce((sum, drop) => sum + drop.areaR ** 2, 0);
      assert.ok(Math.abs(area - plan.totalArea) / plan.totalArea < 5e-4);
      const forward = structuredClone(state);
      L.gatherAt(M, plan, 1 - phase);
      assert.deepEqual(structuredClone(L.gatherAt(M, plan, phase)), forward);
    }
  }
});
