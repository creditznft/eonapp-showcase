# W719.9 — Projects route performance repair

## Exact blocker

The permanent W635 build gate measured `projects.html` at 231,661 gzip bytes with 42 initial assets against its 50,000-byte conversational-route budget. Every other public route passed.

## Root cause

`projects.html` loaded `assets/js/eon-workspace-pages.js`, a shared controller that statically owns Workspace-only creator suites, social connectors, device evidence desks, automation scheduling, privacy controls and Forge deployment preparation. Those unrelated dependencies entered the Projects initial graph even though the Projects surface never renders them.

## Repair

- Added `assets/js/projects/eon-projects-page.js` as the canonical Projects route entry.
- The entry owns only local Projects, handoff review, City beginner-mission continuity, locked-feature truth, bounded RPG receipts and City-mode link tracking.
- `projects.html` no longer loads the full Workspace controller.
- Workspace and Library continue to use `assets/js/eon-workspace-pages.js` unchanged.
- Historical source gates that certify the active Projects owner now read the dedicated entry.

## Safety boundaries

- No project is created, opened, exported, deleted or navigated automatically.
- No network, payment, referral-grant or provider action was added.
- Local Project storage schema and package lock are unchanged.
- Production is not changed; exact build measurement and Preview certification remain required.
