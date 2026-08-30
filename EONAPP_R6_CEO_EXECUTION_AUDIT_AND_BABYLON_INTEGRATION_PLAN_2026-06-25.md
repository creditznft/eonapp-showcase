# EONAPP R6 — CEO execution audit and Babylon integration plan

This document is a concise executive version of the W239–W240/R2 handover. See `HANDOFF/W239_W240_R2_BABYLON_BLUEPRINT_2026-06-25/` for the technical plan, Codex prompt, and validation record.

## Decision

Proceed in two tracks, not one uncontrolled feature wave.

- **Track A: release truth.** Seal public output, deployment workflow, external proof, PWA safety, and rollback discipline.
- **Track B: City reinvention.** Build the first Babylon game district only after the above foundation is stable.

## What was coded in this snapshot

1. Nested `/tools/*` and `/games/*` routes are now redirect-only and excluded from production `dist/` output.
2. A build gate fails if the retired Tool/Game HTML surfaces return.
3. Classic EON is first-run default; System is explicit.
4. Preview and production deployment workflows are separated. Production no longer accepts an arbitrary manually supplied ref.
5. CI includes the new public-output gate.

## Product model

```text
Chat -> Projects -> EON City -> Workspace

EON City Play (Babylon, optional)
  <-> City Lite (all-device fallback)
  <-> City Visual Tour (current Three station, not a second game)

Every City-to-app action: prepare -> review -> user confirm -> open destination.
```

## Immediate CEO priorities

1. Commit the W239/W240 foundation only after Codex re-runs the complete release chain.
2. Capture external Preview evidence. Do not call it launch-ready without it.
3. Inventory and quarantine unreferenced legacy wallet/token/payout/provider families before adding Babylon dependencies.
4. Do a bounded Babylon spike, then decide whether Neon Command District is visually good enough to fund.
5. Do not build seven districts, a combat economy, multiplayer, or commerce before one useful scene is excellent.

## R2 success definition

A new user on a normal phone or desktop can enter an original, dark, full-screen cyber district; move smoothly; meet the EONBOT guide; approach a terminal; review a real useful next action; explicitly open Chat, Projects or Workspace; and later return without local data loss. A weak device gets an honest Lite route instead of a broken 3D promise.
