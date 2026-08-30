# EONCITY R00 — Owner Playthrough Failure Freeze

Date: 2026-08-08
Local programme branch: `local/eoncity-r00-r11`
Remote production/source authority under review: `c807b31c0d3d5a7be9d691756b296fadf82abe74`
Verified reconstruction base: `9e6149763efaf17d203e42f65982054b40c8be50`

## Purpose

Freeze the first human gameplay acceptance failure before product behavior changes. This document is an evidence boundary, not a release claim.

## Owner-visible blockers captured in the 2026-08-08 playthrough

1. Runtime spatial diagnostics report `ok:false` after authored visible frame readiness.
2. Authored/procedural primary structures overlap, including the Living Nexus and EONBOT dock area.
3. Large station/wall displays collide visually with stations/discoveries and duplicate one primary role.
4. Browser resize changes composition without a corresponding camera/UI recomposition authority.
5. Desktop work surfaces and HUD elements compete for the viewport; compact/mobile layouts can become gameplay-blocking.
6. Signal Frontier interaction affordance is unclear; mouse/touch/keyboard `E` do not present one obvious, consistent target contract to the player.
7. Projected labels overlap or become hidden at supported viewport shapes.
8. Signal Frontier presentation contains large low-information/unfinished-feeling spaces and unclear first-minute guidance.
9. Storm Sector is source-present but governed as hidden/locked, conflicting with the newly approved flagship world hierarchy.
10. Re-entry visibly performs an asset-loading phase. Network cache-hit versus true redownload must be distinguished and certified by request-byte evidence.
11. Main City navigation hierarchy is over-populated and does not emphasize Explore/Open Worlds strongly enough.
12. Mobile surfaces can block movement and cannot always be minimized/closed in a way that preserves playability.

## Release status

Human acceptance: **NO-GO**.

PR #49 must remain draft/unmerged. No production promotion is authorized from any R00-R11 intermediate checkpoint.

## Locked rebuild programme

- R01 Spatial Authority Cleanup
- R02 Responsive Viewport + Camera Director
- R03 Surface Manager
- R04 HUD + Label + Interaction Convergence
- R05 Navigation / Menu / Flagship IA
- R06 Signal Frontier 9.5 Recomposition
- R07 Storm Sector Direct Flagship
- R08 Movement / Sprint / Transit / My Frontier
- R09 Persistent Asset Runtime
- R10 Mobile / Accessibility / Browser Matrix
- R11 9.5 Owner Candidate

## Acceptance boundary

No owner-ready candidate until runtime evidence shows zero P0/P1 defects, every major City category >=9.0, overall >=9.5, zero first-party console/network errors, exact source/build provenance, and an owner-approved gameplay recording.
