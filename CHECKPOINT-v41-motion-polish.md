# v41 motion polish

Branch: work/v41-motion-polish
Base: work/v40-performance @ ae0b98b3878301014e2afce4e1c94665d00482ce

Saved checkpoints:
1. b17ba2d — opening and biomes: later eyebrow, smaller text travel, short touch stagger.
2. 66fe7ff — bridge and leaders: separated statements, restrained text movement.
3. c7744df — member story: completion text reaches full opacity during the existing hold.
4. e2e2e60 — finale: subtle anniversary title reveal, quiet film/ending text and controls.
5. Final cache refresh and verification snapshot.

No changes to native scrolling, Desktop scroll physics, wave composition,
Brand composition, liquid geometry/renderers, edge guard, pinch protection,
device profiles or RAF scheduling. Gather, split and orbit trajectories retained.

Validation: npm run check and all seven existing motion/liquid tests passed.
Diff review confirms only typography/timing, additive CSS and asset references changed.
Browser preview connection was refused; browser smoke and real-device performance
are NOT verified. Device QA remains: fast/reverse touch swipes, Hero occlusion,
native scroll smoothness, text visibility with reduced motion, Desktop browsing.
No merge to main or writes to the performance baseline.
