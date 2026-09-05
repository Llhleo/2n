/* Pure timing and scroll geometry; no DOM and no network dependencies. */
(function (target) {
  'use strict';
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, t) => from + (to - from) * t;
  const progress = (value, from, to) => clamp((value - from) / (to - from));
  const smooth = t => t * t * (3 - 2 * t);
  const easeOut = t => 1 - Math.pow(1 - clamp(t), 4);
  const DURATION = 5600;
  function intro(time) {
    return {
      lineOne: easeOut(progress(time, 100, 880)),
      lineTwo: easeOut(progress(time, 680, 1530)),
      statementExit: smooth(progress(time, 1880, 2680)),
      curtain: smooth(progress(time, 2040, 3450)),
      world: easeOut(progress(time, 2200, 4140)),
      logo: easeOut(progress(time, 2990, 4570)),
      eyebrow: easeOut(progress(time, 3780, 4370)),
      copyOne: easeOut(progress(time, 4250, 4930)),
      copyTwo: easeOut(progress(time, 4500, 5240)),
      controls: smooth(progress(time, 4920, 5500)),
      complete: time >= DURATION
    };
  }
  function scroll(position, lead, travel) {
    return {
      entry: clamp(position / lead),
      x: clamp(position - lead, 0, travel),
      progress: clamp(position / Math.max(1, lead + travel))
    };
  }
  const api = Object.freeze({ clamp, lerp, progress, smooth, easeOut, DURATION, intro, scroll });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else target.TwoNMotion = api;
})(typeof window === 'object' ? window : this);
