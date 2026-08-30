# EONAPP Launch95 RT81–RT86 Red-Team Scorecard

Date: 2026-08-11

## Scope and scoring rule

This scorecard evaluates the **source candidate** after the W80 freeze plus RT81–RT86 red-team repairs. It does not pretend source tests can certify rendered visual quality, real browser GPU performance, Cloudflare deployment state, external AI-provider credentials, or closed-tab Web Push. Those remain Codex/owner-machine proofs.

## Executive score

**Source/code readiness: 9.55 / 10**

This clears the owner's 9.5 source-quality target, but **the launch itself is not yet certified 9.5/10** until the real Chrome + Edge + mobile + FPS/cache + Cloudflare Preview proofs pass.

| Area | Score | Why |
|---|---:|---|
| City / Worlds source logic | 9.6 | Three-World authority reconciled; starter My Frontier truth, Storm release truth, Signal explicit handoff, mission/workspace return, single-scene ownership and progression contracts are green. |
| AI / provider systems | 9.6 | Institutional AI 108/108; runtime-enabled hosted providers exactly match governed active contracts; disabled transports fail closed; saved retired models recover safely; Fireworks discovery and current provider governance repaired. |
| Security / privacy / BYOK | 9.7 | BYOK/local-first custody, endpoint allowlists, encrypted push subscription custody, disabled-provider fail-closed boundary, deterministic privacy gates and security authorities remain green. |
| Web Push / retention architecture | 9.6 | RT86 replaces 4,800/day direct Cron bottleneck with D1 due authority -> Queue -> bounded consumer -> Web Push; Preview-only Cron; Production rollout and Cron both source-disabled. |
| Performance / cache / workload governance | 9.6 | One Babylon owner, optional-asset pressure shedding, immutable City caching, lazy world/Creator loading, bounded queue/D1 concurrency and workload leases remain enforced. |
| Mobile / accessibility / input | 9.6 source | Current source contracts are strong; actual touch ergonomics and viewport composition still require owner-device render proof. |
| Release / certification hygiene | 9.7 | Stale Worlds/browser authorities reconciled; Launch95 final gate widened to cross-system authorities; W306 and RT86 added to maintained inventory; W624D archive/alignment clean. |
| Maintainability | 9.0 | Main remaining structural debt is the very large W731 Command Hub runtime. It is stable enough to launch but should be decomposed post-stabilization rather than risk a pre-launch rewrite. |
| Rendered visual polish | **PENDING** | Source cannot honestly certify AAA/9.5 rendered appearance, camera composition, animation feel, FPS or browser-specific layout. |

## Red-team defects found and repaired

### RT81 — City Creator parity
- Canonical Creator styling is lazy-loaded when the in-City Creator opens instead of bloating City initial boot.
- City continues using maintained real Create/Image/Video/Music paths rather than a proposal-only fork.

### RT82 — AI provider authority
- Active browser provider authority reconciled with runtime truth.
- NVIDIA and SambaNova remain reviewed but disabled where browser transport is unsafe.
- Fireworks model discovery corrected to the current account/serverless model-list shape.
- Saved retired-model recovery hardened; disabled providers fail closed before network activity.
- Provider onboarding copy no longer makes volatile free-credit/model-count/"fastest" claims.

### RT83 — Worlds authority
- Stale Open World / launcher certification assertions reconciled with the current Signal Frontier / Storm Sector / My Frontier hierarchy.
- No gameplay rewrite was required.

### RT84 — certification / UI debt
- Retired quick-Expanse and featured Share/Plans selectors/handlers removed.
- Historical Playwright specs now target maintained controls.
- Web Push test flake made deterministic.
- PostCSS declared directly because certification code imports it.
- Launch95 final source gate widened to cross-system authorities.

### RT85 — hostile whole-product audit
- Direct first-run **Explore Worlds** welcome action added without auto-entering a World.
- Cohere/Anthropic/NVIDIA/SambaNova dormant transports explicitly fail closed from stale saved settings.
- W306 local-first gate crash fixed; Profile restores **encrypted portable backup** and **no automatic cross-device sync** truth.
- Maintained test inventory gap repaired.

### RT86 — retention Web Push scale/cost
- Replaced direct 50-reminder / 15-minute fan-out with indexed D1 scheduler -> Cloudflare Queue -> bounded consumer -> Web Push.
- Release authority: 5,000 due reminders/minute; theoretical 7.2M reminder releases/day before downstream limits.
- Queue consumer: 50-message batches, max concurrency 10, four reminders concurrently inside an invocation, server-entitled devices/account (Free/Trial 1; Plus 2; Studio 3; Power 4; Max 5 after RT87).
- New terminal reminders are deleted instead of creating a 30-day D1 graveyard.
- Legacy terminal/disabled rows get bounded indexed cleanup.
- No per-success D1 heartbeat write in the hot path.
- Preview: `testing` + one-minute Cron.
- Production: `disabled` + `crons=[]`; enabling secrets/resources alone cannot start delivery.
- Separate Preview/Production VAPID + custody keysets; same four values must be installed into Pages + retention Worker within an environment.

## Fresh source evidence after RT86

- Launch95 unit family: **182/182 PASS**.
- Institutional AI v2 source gate: **108/108 PASS**.
- RT86 notification scale authority: **23/23 PASS**.
- RT86 unit lane: **5/5 PASS**.
- W624D test archive: **10/10 PASS**.
- W624D current-contract alignment: **17/17 PASS**.
- Maintained current manifest: **384 files**.
- Canonical dependency-free maintained replay: **1,437 PASS + 47 explicit historical skips = 1,484 outcomes; 0 failures across 371 files**.
- Exactly **13 maintained dependency-backed files** are deferred to the real checkout after `npm ci`.
- Changed JS/MJS static syntax scan before packaging: clean.
- Secret scan before packaging: no hardcoded push key material or credential findings.

## What is intentionally not certified here

1. Exact original Git-tree cleanliness after applying this delta to `chatgpt/launch95` at `cb532648`.
2. `npm ci` + all dependency-backed maintained tests.
3. Production build and build-artifact gates.
4. Authenticated Chrome and Edge owner proof.
5. Mobile landscape touch/UI proof.
6. Lite / Balanced / Cinematic FPS proof and 10-transition soak.
7. Cloudflare Preview D1 migration + Queue/DLQ + Worker deployment.
8. Closed-tab Web Push self-test and real five-minute Cron -> Queue -> Worker -> push proof.
9. External AI/local-provider credential/media proofs.
10. Production promotion. Production remains unchanged and push remains source-disabled.

## Final design judgement

Do **not** perform a pre-launch architectural rewrite of W731 simply to improve file size. The current risk/reward favors shipping the tested runtime, completing owner-machine proofs, stabilizing for seven days, and then decomposing the monolith behind the existing contracts.
