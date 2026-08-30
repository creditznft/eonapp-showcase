# W254 — City Play local performance governor

- Added a bounded 150-frame local warm-up check.
- Added one-way local visual protection for slow non-Lite sessions: disable rain
  and glow, apply capped hardware scaling, expose truthful status.
- Added performance-governor state to local runtime summaries.
- Preserved the visitor’s selected profile, work state, City mission state,
  action boundary, City Lite exit and zero remote-I/O model.
- Added W254 source gate and focused tests.

**Not claimed:** measured mobile FPS, thermal behavior, memory/driver recovery
or final device readiness.
