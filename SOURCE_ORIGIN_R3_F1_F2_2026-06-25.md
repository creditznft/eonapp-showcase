# Source origin — R3-F1/F2

This checkpoint derives only from the current W255–W257 source tree in this working directory. It does not merge older handovers over current work.

## Baseline

- Previous checkpoint: `EONAPP_W255_W257_CITY_BEGINNER_WORK_MISSIONS_LOCAL_STATIC_HANDOFF_2026-06-25.zip`.
- Current scope: R3-F1 physical value-system source reduction and R3-F2 root route tiering.
- Runtime additions: none.
- Runtime removals: redirect-only Tier-3 root documents and unreferenced dormant value-system sources.
- Product behavior change: no new value or credential capability; stale retired routes remain edge-redirected only.

## Explicit exclusions from the handover archive

`node_modules`, `dist`, `.git`, `.env*`, caches, compiler artifacts, generated runtime folders, credentials and secrets are excluded. The two retired source archives are included because they preserve reproducible provenance and SHA-256 manifests.
