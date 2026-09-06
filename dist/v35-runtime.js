(() => {
  'use strict';

  // v35 compatibility layer for the existing v34 app shell.
  // It keeps the current page structure intact while moving the liquid chapter
  // onto stable phase samples and letting iOS Safari own touch momentum.
  const root = document.documentElement;
  const M = window.TwoNMotion;
  if (!M) return;

  const clamp = value => Math.max(0, Math.min(1, value));
  const originalBridgeScroll = M.bridgeScroll;
  const touchFirst = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;

  M.bridgeScroll = function(distance, start, duration) {
    const state = originalBridgeScroll(distance, start, duration);
    // Only the very long member/liquid hold is sampled. The horizontal position
    // stays native-scroll exact, so forward and reverse scrolling remain matched.
    if (duration >= 4800 && state.phase > 0 && state.phase < 1) {
      const steps = touchFirst ? 720 : 1080;
      const raw = clamp((distance - start) / duration);
      state.phase = Math.round(raw * steps) / steps;
    }
    return state;
  };

  // app.js v34 installs a custom horizontal touch gesture that calls
  // preventDefault/scrollBy. During app bootstrap, suppress only those three
  // window-level touch registrations; every other event listener is untouched.
  const nativeAdd = window.addEventListener;
  const blocked = new Set(['touchstart', 'touchmove', 'touchend']);
  let booting = true;
  window.addEventListener = function(type, listener, options) {
    if (booting && blocked.has(type)) return;
    return nativeAdd.call(this, type, listener, options);
  };

  nativeAdd.call(window, 'DOMContentLoaded', () => {
    booting = false;
    window.addEventListener = nativeAdd;
    root.dataset.version = '35';
  }, { once: true });
})();
