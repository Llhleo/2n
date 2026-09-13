# Stage 1 implementation checkpoint — 2026-09-13

Status: prototype implemented; stage 1 acceptance NOT passed; stage 2 blocked.

## Run and inspect

From this directory: `npm ci`, `npm run build`, `npm run dev`.
The standalone static entry is `public/index.html`; `study.html` contains both real Core candidates, angle controls and expansion control. Runtime dependencies are bundled locally.
Default entry uses WebGL. `?renderer=svg` is an explicitly labelled geometry diagnostic, not a mobile fallback or GPU benchmark. `?fallback` checks ordinary reading. `?input=touch` checks the horizontal input adapter but does not emulate an iPhone.

## Core decision

Selected A: three independently addressable, beveled, authored 2ⁿ outline layers. No font or TextGeometry. B uses round 3D tube paths. Both are actual renderable geometry and remain inspectable in the study page.

| Geometry | Standard triangles | Mobile triangles | Closed depth |
| --- | ---: | ---: | ---: |
| A | 3,900 | 1,476 | 0.541 |
| B | 4,932 | 1,668 | 0.896 |

Counts include nine instanced nodes. CPU geometry comparison covered frontal, ±30° and 75° bounds, finite vertices, thickness and stable part IDs. A preserves a broad solid outline with fewer triangles and separates into readable layers; B's narrow round strokes and overlapping depth layers make it the less suitable primary candidate. This is an engineering/design selection, NOT a completed screenshot-based perceptual test. The required three-observer recognition test remains outstanding.

## Implemented slice

Hero → garden → desert → ocean → first layered expansion and internal nodes. One persistent Core, one scene, deterministic reversible scroll state, landscape foreground occlusion, continuous environment pan, chapter navigation, keyboard controls, return-to-start, mobile native horizontal scrolling, low-DPR quality, reduced motion, hide-Core comparison, ordinary reading, local 60-second measurement/export controls. Background suspension, BFCache/resize handling and bounded context recovery are implemented but not yet verified on physical devices.

No management/member/liquid integration; no stage 2. All 33 stable baseline hashes match. GitHub main, tag, Pages workflow and stable assets are unchanged.

## Evidence and acceptance

| Gate | Result | Evidence / limitation |
| --- | --- | --- |
| Build and state/geometry checks | PASS | Six Node tests; finite geometry, 1,001 sampled states, reverse determinism and continuous boundaries |
| Stable baseline | PASS | 33 files byte-identical to baseline.json |
| Geometry budgets | PASS | A standard 3,900, mobile 1,476; under original budgets |
| JS transfer budget | PASS (build estimate) | Main bundle ~138 KiB gzip; generated model included. HTTP/network timing not measured |
| Initial critical asset budget | PASS (file estimate) | Main bundle ~540 KB raw, local HTML/CSS/bootstrap and ~8.5 KB terrain module; under 1 MiB. Study/SVG diagnostic loaded separately |
| Visual gain / recognition / content relation | PENDING | No completed rendered A/B or matched v1 comparison; no observer feedback |
| Actual scroll continuity | PENDING | Mathematical state checks pass; five repeated slow/fast/reverse UI cycles not completed |
| Desktop GPU/frame rate | BLOCKED | Earlier cloud Chrome reported WebGL unavailable and showed complete ordinary content. Resumed preview then connection refused; after supervised preview restart the browser URL policy blocked access. No bypass attempted |
| iPhone / low-end mobile | PENDING PHYSICAL DEVICE | No actual Safari/Android measurements, no device emulation claimed |
| Five-minute load / lifecycle | PENDING PHYSICAL DEVICE | Code coverage is not runtime evidence |
| Cold-load LCP / first 3D frame | PENDING | Fixed network, cold-cache, five-run comparison not performed |
| Accessibility / failure | PARTIAL | Ordinary content after WebGL failure observed; reduced-motion/static state automated test passes; full keyboard/zoom/JS-failure checks pending |

The frame log keeps long active stalls; inactive/background intervals are excluded by ending the sampling session. CPU time, rAF spacing and GPU time are explicitly distinct; GPU time is not measured. Exported device records stay local unless the user shares them.

## Bounded deviations and remaining risks

The small 1,280 × 256 CSS atlas combines five retained landscapes (~6.3 KB WebP, ~1.25 MiB decoded) instead of loading current/next full images. It is not a GPU texture and no full original PNG is replaced. This changes the resident-image-count plan but substantially bounds decoded memory; visual resolution and seams still need review.

This slice uses an independent native vertical desktop/horizontal touch adapter, not a migration of v1's scrolling engine. Most spatial movement currently comes from Core transforms; camera dolly is restrained. Do not claim the complete single-world website has been demonstrated. Mobile reading layout and foreground/Core intersection are unverified visual risks.

Recommendation: keep stage 1 open. Do not enter stage 2 until rendered visual checks and original real-device hard gates pass. Deliver the isolated prototype for direct experience without changing stable v1.
