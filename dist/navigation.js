/* Chapter destinations and resize anchors; app still owns scroll and animation. */
(function (target) {
  'use strict';
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function adjacentStop(stops, position, direction, tolerance = 4) {
    if (direction > 0) return stops.find(stop => stop > position + tolerance);
    for (let i = stops.length - 1; i >= 0; i--)
      if (stops[i] < position - tolerance) return stops[i];
    return undefined;
  }

  function captureAnchor(entries, position, viewportWidth) {
    const entry = entries.find(entry => position >= entry.x && position < entry.x + entry.width);
    if (!entry) return null;
    const span = entry.hold ? Math.max(1, entry.width - viewportWidth) : Math.max(1, entry.width);
    return { target: entry.target, ratio: clamp((position - entry.x) / span, 0, 1), hold: !!entry.hold };
  }

  function restoreAnchor(anchor, bounds, viewportWidth, fallback) {
    if (!anchor) return fallback;
    const entry = bounds.get(anchor.target);
    if (!entry) return fallback;
    const span = anchor.hold ? Math.max(1, entry.width - viewportWidth) : Math.max(1, entry.width);
    return entry.x + anchor.ratio * span;
  }

  function create({ getState, storyPosition, scrollStory, scrollForX, schedule, fallback }) {
    function goTo(value) {
      const state = getState();
      if (!state.active) { fallback(value); return; }
      if (!state.ready) return;
      const geometry = typeof value === 'string'
        ? state.geometry.find(entry => entry.panel.id === value) : null;
      const destination = geometry ? scrollForX(geometry.x) : typeof value === 'number' ? value : 0;
      scrollStory(clamp(destination, 0, state.max), state.reduced ? 'instant' : 'smooth');
      schedule();
    }
    function nextStop(direction) {
      const stop = adjacentStop(getState().stops, storyPosition(), direction);
      if (stop !== undefined) goTo(stop);
    }
    return Object.freeze({ goTo, nextStop });
  }

  const api = Object.freeze({ adjacentStop, captureAnchor, restoreAnchor, create });
  if (typeof module === 'object' && module.exports) module.exports = api;
  else target.TwoNNavigation = api;
})(typeof window === 'object' ? window : this);
