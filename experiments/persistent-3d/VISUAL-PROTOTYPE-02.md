# Visual Prototype 02 — checkpoint record

Date: 2026-09-13. Scope ends at First Structural Reveal. No management, members, liquid or anniversary work was started.

## Saved checkpoints

- A 1913881: Core geometry redesign.
- B 9528cf8: static Hero, material and lighting.
- C 33713cf: camera and Garden / Desert / Ocean response.
- D 5804df6: structural seams, connection spine and nodes.
- E b30113e: mobile composition and render budget.

## Current implementation

The primary Core is not extruded text. Six continuous tubular members form a front-readable 2ⁿ and share stable seams. Three collars mark structural joints. During the final reveal, shell members move by small deterministic offsets while the connection spine and eight nodes become visible. Reverse scroll produces the same states in reverse.

Desktop geometry is 14,520 triangles; touch geometry is 5,404. The main JavaScript bundle is about 138 KiB gzip. There are no post-processing passes, shadow maps, environment maps or remote runtime scripts. Touch uses DPR 1 (0.85 in light mode) and a 30 fps cap; rendering sleeps after interaction.

Garden, Desert and Ocean reuse derived versions of the unchanged v1 assets in one 1,536 × 384 atlas (~10.7 KiB encoded, 2.25 MiB decoded). The atlas pans continuously behind three differently masked depth layers. Core material, key/fill/rim light, atmospheric tone, camera position and look target interpolate from the same scroll state.

## Checks

- Seven automated geometry, state, reduced-motion, baseline and asset checks pass.
- Desktop and 390 × 844 responsive DOM composition load without CSS/runtime errors in the supervised preview.
- Desktop chapter navigation and the mobile horizontal adapter return to the correct eventual semantic state.
- The cloud browser does not provide WebGL here. Its explicit SVG diagnostic also cannot render the PhysicalMaterial scene, so generated screenshots do not constitute Core visual approval.
- Real iPhone Safari, Android, GPU frame timing, five-minute lifecycle and cold-network measurements remain pending.

Do not interpret responsive simulation as physical iPhone validation. Do not merge into main or enter the next narrative stage until the rendered Core and real-device behavior are reviewed.
