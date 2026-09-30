const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');

const source = readFileSync(require.resolve('../dist/assets.js'), 'utf8');

function setup(decode, existingImage) {
  let image=existingImage, timeout;
  if(existingImage) existingImage.decode=decode;
  let cleared = false;
  const context = { module: { exports: {} },
    Image: class {
      constructor() { image = this; }
      decode() { return decode(); }
    },
    setTimeout(callback, delay) {
      assert.equal(delay, 4500);
      timeout = callback;
      return 1;
    },
    clearTimeout() { cleared = true; }
  };
  runInNewContext(source, context);
  const loadImage = context.module.exports.loadImage;
  const result = loadImage('assets/garden.png', existingImage);
  return { result, image, expire() { if (!cleared) timeout(); }, cleared: () => cleared };
}

test('successful loading waits for decode and clears the deadline', async () => {
  let finishDecode;
  const state = setup(() => new Promise(resolve => { finishDecode = resolve; }));
  const loading = state.image.onload();
  assert.equal(state.cleared(), false);
  finishDecode();
  await loading;
  assert.equal(await state.result, state.image);
  assert.equal(state.cleared(), true);
});

test('a stalled decode falls back at the deadline, even after onload', async () => {
  let finishDecode;
  const state = setup(() => new Promise(resolve => { finishDecode = resolve; }));
  const loading = state.image.onload();
  state.expire();
  assert.equal(await state.result, null);
  finishDecode();
  await loading;
  assert.equal(await state.result, null, 'late decoding cannot replace the fallback');
});

test('network failures and missing load events resolve to a partial background', async () => {
  const error = setup(() => Promise.resolve());
  error.image.onerror();
  assert.equal(await error.result, null);
  const timeout = setup(() => Promise.resolve());
  timeout.expire();
  assert.equal(await timeout.result, null);
});

test('decode rejection retains the loaded image instead of blocking startup', async () => {
  const state = setup(() => Promise.reject(new Error('decode failed')));
  await state.image.onload();
  assert.equal(await state.result, state.image);
});

test('an already loaded DOM image is decoded without replacing its source', async () => {
  const existing = { complete: true, naturalWidth: 100 };
  Object.defineProperty(existing, 'src', { set() { throw new Error('Must not restart a displayed image'); } });
  let decoded = 0;
  const state = setup(() => { decoded++; return Promise.resolve(); }, existing);
  assert.equal(await state.result, existing);
  assert.equal(decoded, 1);
  assert.equal(state.cleared(), true);
});

test('an already failed DOM image falls back without waiting for another load event', async () => {
  const existing = { complete: true, naturalWidth: 0 };
  const state = setup(() => { throw new Error('A broken image must not decode'); }, existing);
  assert.equal(await state.result, null);
  assert.equal(state.cleared(), true);
});

test('a pending displayed image retains the bounded deadline after late completion', async () => {
  const existing = { complete: false, naturalWidth: 0 };
  const state = setup(() => Promise.resolve(), existing);
  state.expire();
  assert.equal(await state.result, null);
  existing.complete = true;
  existing.naturalWidth = 100;
  await existing.onload();
  assert.equal(await state.result, null);
});
