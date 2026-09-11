# v40

Base: origin/main 912421f (v39.1), website files match previous delivery.
Working branch: work/v40-performance.

1. Profiling baseline: opt-in ?perf=1 counters for frame/liquid/world duration,
long-frame runs, section and renderer. Normal visits allocate no profiler UI
or timer. v39 touch scroll currently schedules the full track render.
