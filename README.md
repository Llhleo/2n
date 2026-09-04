# 2n Website v12

Static HTML/CSS/JS version for GitHub / Cloudflare Pages.

## v12 changes
- Opening scroll is now hard-locked until the complete `2ⁿ` horizon-rise and slogan reveal finishes (~6.4 s).
- Locks wheel, touchmove and keyboard scrolling; includes a 9 s safety unlock.
- Reworked the World section into one continuous five-biome panorama rather than flat color cards.
- Added pinned world chapter UI, progress rail and current biome counter.
- Added biome-specific atmosphere: petals, sand dust, bubbles, leaves and embers.
- Chinese-first biome copy with small English labels.
- Mobile layout keeps the same horizontal chapter but with simplified atmosphere for performance.

## Deploy
Upload the contents of this folder to the repository root. `index.html` must stay at the root.
No build step is required for Cloudflare Pages.
