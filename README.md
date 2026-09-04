# 2n-site-v15

- 修正五生态“看起来没有放入原图”的问题：改为每个生态都直接展示你给的原始游戏截图，而不是仅作为背景裁切
- 五生态章节仍保留横向滚动，但现在是“左侧大图 / 右侧说明”的宣传页结构
- 保留并延续横向管理层章节

# 2n-site-v14

- 五生态横向章节已切换为你提供的 5 张原始游戏截图（旋转为横屏后使用）
- 管理层章节改为像生态一样的横向滚动章节
- 新增管理层详情：awdc / flowerwsr / cnflydream / sschara

# 2n-site-v13

- 五生态章节已改为使用你提供的游戏原图（由合成长图切成 5 个生态面板）
- 新增 Members 章节，展示公会规模和部分成员
- 保留 v12 的首屏锁滚动与开场逻辑

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
