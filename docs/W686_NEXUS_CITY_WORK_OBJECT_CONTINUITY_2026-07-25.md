# W686 — NEXUS-to-City Work-Object Continuity

Date: 2026-07-25
Branch: `local/w671-n3-c3-rebuild`

## Completed scope

- Maps an explicitly selected NEXUS work object to the correct productive City district and physical Nexus station.
- Writes a bounded, expiring, privacy-projected handoff receipt only after explicit user action.
- Carries the selected object through the existing W662C continuity store without creating a second state authority.
- Shows the proposed/arrived object in the City Nexus panel and as a visible holographic object beside the mapped station.
- Makes the holographic work object directly pickable; proximity opens the reviewed Nexus continuity panel only.

## Confirmation boundaries

- Entering City, district travel and opening the native object action remain separate confirmations.
- No auto-navigation, auto-execution, auto-approval or raw private-content transfer.
- The City representation uses the existing Babylon scene and render loop.
