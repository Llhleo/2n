# v40

Base: origin/main 912421f (v39.1), website files match previous delivery.
Working branch: work/v40-performance.

1. Profiling baseline: opt-in ?perf=1 counters for frame/liquid/world duration,
long-frame runs, section and renderer. Normal visits allocate no profiler UI
or timer. v39 touch scroll currently schedules the full track render.

2. Capability resolver prioritizes fine+hover even with touch support; layout is
independent. Debug overrides are local-only.
3. Touch now scrolls the actual hero, five biomes and sections in one flex flow.
No invisible extent, no touch track-translation render calls.
4. Leaders are full-width native cards, with observer/CSS reveals; bridge is a
real wide section with a sticky local visual. Ordinary scroll does not wake RAF.

5. Members use a native long section and sticky stage. Touch catch-up is capped
at four representative contact/absorb/release/break states and 96 ms. It never
pins the track or changes scroll position; leaving the section clears catch-up.

6. SVG/Canvas geometry-only prototype and AB/BA benchmark are saved at
`/__qa/liquid-benchmark?input=touch` when running `npm run dev`.
Benchmark NOT completed: Cloud Browser refused the local preview connection.
Production retains SVG; there is no measured evidence to select Canvas yet.

7. Touch labels skip invisible DOM writes, ordinary sections exit the main frame,
and leaving Members clears both queued samples and the final catch-up flag.
WorldScene retains its cached post-intro rendering; desktop rendering remains
independent. Version and asset queries are 40.

Requested visual update: message reveal uses the measured widest text line plus
padding as the mother-diameter threshold. Released particles taper to 55% of
their previous diameter, remain mother-colored through split, and gradually
gain muted hues in orbit. This optical taper retains source mass accounting but
does not conserve projected screen area during release; review that tradeoff.

Validation: static asset/script checks and seven geometry/motion tests pass.
Checkpoint 8 browser smoke and checkpoint 6 measured renderer comparison remain
open. No iPhone Safari performance result or full visual acceptance is claimed.
