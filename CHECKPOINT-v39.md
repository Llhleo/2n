# v39 checkpoints

## v39.1 correction

User clarified that touch should replace the whole vertical progress axis with horizontal input, not use independent carousels in a vertical page. Removed mobile chapter wrappers and rails. One native horizontal shell now drives the same sequential desktop story mapping, bridge holds and liquid holds. Sticky scene layers remain inside the scroll container; all 95 members and v39 liquid/Canvas optimizations are unchanged. Document vertical scrolling is disabled only while touch enhancement is active; fallback remains readable. Cache version is 39.1.

Static checks and 7 geometry/timing tests passed. Chrome forced-touch startup and horizontal chapter navigation passed; synthetic browser gestures timed out, so real iPhone touch gestures still need device verification.

Base: main f9ba99e (v38). GitHub branch creation: integration 403.

1. Read current entrypoints, liquid/motion/runtime, styles and Canvas.
2. Explicit reversible contact/absorption; interpolated conserved area; fine liquid sampling; bounded visual progress.
3. Shared compact release neck, staggered separation and tangent flight; split mass transfers into 23 retained orbit drops.
4. Compact circle arcs, reusable mother points and gather drops, unchanged-path/hidden-label write guards; removed listener monkey patch and bridge quantization.
5. Touch layout uses native biome horizontal scrolling; independent vertical chapter holds and cached top positions preserve bridge/liquid progress. Desktop track retained.
6. Management native horizontal rail, cached card offsets, native gestures and chapter-button rail navigation.
7. Cached Canvas gradients/terrain/size; stable touch viewport with real resize/orientation rebuild; v39 entrypoints.
8. Static assets/syntax passed; existing 7 tests passed. Dense 95-member touch geometry produced 742 neck samples with conserved gather and split area. Chrome desktop and forced touch branch booted ready; both native rails scrollable and member SVG updated. Fixed pre-initialization RAF discovered in smoke check.

Run: npm run dev (serve dist); npm run check; npm test.
Next: Terra real-iPhone Safari gesture/visual/performance QA, especially rapid reverse scrolling, split-to-orbit handoff and toolbar/orientation changes. Forced touch Chrome is not an iOS Safari test. Orbit radii now carry the conserved split mass, rather than shrinking away during release.
