# W257 — City beginner missions that create truthful local work

**Status:** Local-static complete on 2026-06-25. This is not device, browser, Preview, PWA-update/rollback, deployment or public-release proof.

## Outcome

EON City now has three finite beginner paths that can lead to real local work without creating a game economy or pretending that a route visit completed anything:

1. **Build Workshop → Projects:** the person chooses a title and explicitly saves one ordinary local Project.
2. **Knowledge Archive → Workspace:** the person chooses a title and explicitly saves one ordinary local Project brief.
3. **Local AI Observatory → Local AI:** the person selects an installed runtime and explicitly starts a self-test; the receipt records only `passed` or `not-passed`.

Every route begins in a City renderer with the existing **prepare → review → separate confirmation** boundary. A cancellation dismisses the offered receipt. A route visit cannot create a Project, self-test a runtime, select EONBOT routing, grant a permission, or create value.

## What changed

- Generalized the W251 local mission receipt into a backward-compatible three-mission contract at `assets/js/city/city-work-mission.js`.
- Kept the existing opaque `eon.city.work-mission.v1` record format and W251 compatibility wrappers so existing local Workspace receipts remain readable.
- Added finite definitions for `first-project`, `project-brief`, and `local-ai-self-test`, including fixed City landmark, action, same-origin destination and truthful outcome allowlists.
- City Play, City Lite and Visual Tour now each offer/open/dismiss the same generic local mission receipt only after a canonical prepared action.
- Projects and Workspace render an explicit save form; only that button creates the ordinary local Project and completes the matching receipt.
- Local AI adds a City mission card that does not scan, self-test or select a runtime on render. It records only the user-tapped self-test outcome and explicitly states that a pass does not auto-select EONBOT.
- Added a W257 source/output safety gate and six focused unit tests. Updated the historical W251 copy expectation for the generalized save label.

## Local data and safety boundary

Mission receipts retain only opaque IDs, finite local route/action metadata, timestamps, state and a small outcome enum. They do **not** retain project title/summary, Chat text, prompts, runtime endpoint, model name, provider information, credentials, wallet/chain state, remote identifiers, rewards or economic value.

No mission module performs remote transport, navigation, DOM secret intake, wallet work, contract work, commerce, referral value, token/reward/loot handling or background work.

## Evidence

- 192/192 approved current-product tests passed.
- Zero-warning lint passed.
- Production build passed.
- W239/W242/W243/W244/W247/W248/W249/W250/W251/W252/W253/W254/W255/W256/W257 gates passed against current source/output.
- Build smoke, site audit, readiness, PWA install, identity, page, quality, secret and production dependency-audit checks passed.
- `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.

Logs: `EVIDENCE/W257_BEGINNER_WORK_MISSIONS_2026-06-25/`.

## Non-goals

- No game currency, XP, rewards, loot, token, referral value, payment, marketplace, wallet, chain RPC, signing, public publishing, multiplayer or social graph.
- No autonomous EONBOT action, credential path in Chat, runtime installation, automatic runtime selection, cross-device sync or cloud account claim.
- No claim that a self-test passes on every device or that a project brief is a completed product.

## Open proof

Physical Android/iPhone/desktop City controls, visual quality, landscape/full-screen behavior, self-test task completion, PWA update/rollback, Preview/live deployment, CSP/network/console, accessibility, Git/production-secret review and human release approval remain open under W259/W260 and the R3 release board.
