# v42 release candidate

Branch: work/v42-qa-release
Baseline: work/v41-visual-impact @ 30be5069c73f27d57b1a7d17f8f134ddfe3c40d5

- Touch and story integration: code audit found no confirmed production defect; no speculative code changes or empty commits.
- Cross-device audit: repaired the local `/__qa/missing-app` route, which failed to remove a versioned `app.js` tag and therefore never tested fallback. Verified the HTTP route omits that tag.
- Release: all CSS/JS links and runtime dataset use `42rc1`; metadata and static checks updated. No scroll, wave, brand, liquid or animation logic changed.

Verified: static asset/JS checks, seven existing motion/liquid tests, fallback HTTP route, and profile selection for desktop, narrow desktop, wide touch and hybrid laptop using the actual profile resolver.

Not verified: Cloud Browser could not connect to the local QA server. No actual Touch, iPhone Safari, Desktop browser, console, video playback or frame-rate measurement was completed. Keep this branch as a candidate until real-device checks pass; do not merge it to main or declare 1.0 yet.
