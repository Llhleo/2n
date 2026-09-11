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
