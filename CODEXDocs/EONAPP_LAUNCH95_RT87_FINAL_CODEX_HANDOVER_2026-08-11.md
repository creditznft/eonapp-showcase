# EONAPP Launch95 RT87 — Final Codex Handover Authority

Date: 2026-08-11

## 0. Canonical release state

- Repository: `creditznft/EONAPP`
- Branch authority: `chatgpt/launch95`
- Live ancestor: `7a833c91203c5c1dc82e8529c83a619473d67261`
- Last committed Launch95 HEAD before the exported continuation: `cb532648f6942eca555dacd1d20d6a4260ac0678`
- **Production has NOT been changed to Launch95 by ChatGPT.**
- This package is the semantic W80 candidate plus RT81–RT87 repairs.
- Do not infer original Git provenance from this exported ZIP. Apply the supplied patches in the real checkout and prove Git state there.
- Do not deploy Production until every installed source/build/browser/Cloudflare proof below passes.

## 1. RT87 final cost-control policy

Browser push device allowance is server-authoritative from the Dodo billing entitlement ledger:

| Billing truth | Active push devices |
|---|---:|
| Free | 1 |
| Trial | 1 |
| Plus active/cancelling | 2 |
| Studio active/cancelling | 3 |
| Power active/cancelling | 4 |
| Max active/cancelling | 5 |
| Grace / past_due / revoked / disputed / expired / unknown | 1 |

Rules:
- the browser cannot request or override a tier/cap;
- enrollment reads server billing truth and prunes excess devices immediately;
- newest allowed active devices are kept, older excess subscriptions are disabled;
- Dodo lifecycle processing re-prunes when push rollout is active, so downgrade/expiry automatically returns the account to the lower allowance;
- missing/unreadable billing authority fails closed to **1 device**;
- Preview has no billing D1 binding in source and therefore safely behaves as Free=1 unless Codex creates a separate Preview billing database;
- **never bind the Production billing database to Preview merely to test paid device caps.**

Read: `CODEXDocs/EONAPP_RT87_PUSH_DEVICE_ENTITLEMENT_COST_CONTROL_2026-08-11.md`.

## 2. Critical RT87 schema correction

RT86 introduced identity migration `migrations/identity/0005_notification_scale_indexes.sql`. RT87 found that the central identity schema authority was still pinned to version 4. That mismatch would have made authenticated identity routes fail closed after migration 0005 was applied.

RT87 corrects the authority to **identity schema version 5**, updates Cloudflare source authority and maintained mocks, and regenerates the canonical D1 migration manifest.

Codex MUST prove after applying migrations:
- all 10 ordered D1 migrations pass the A15 I21 gate;
- `eon_schema_authority` for identity is version **5**;
- no request-time DDL is introduced;
- authenticated identity routes remain green.

Do not deploy Preview push if migration 0005 and identity authority v5 are not aligned.

## 3. Fresh ChatGPT-side evidence

- Launch95 unit family: **182/182 PASS**.
- Institutional AI v2 source authority: **108/108 PASS**.
- Institutional AI current unit batch: **79/79 PASS**.
- RT86 retention scale authority: **23/23 PASS**.
- RT86 unit lane: **5/5 PASS**.
- RT87 push-device entitlement authority: **17/17 PASS**.
- RT87 unit lane: **3/3 PASS**.
- A15 I21 ordered D1 migration gate: **PASS — 10 ordered migrations**.
- Affected identity/auth compatibility suites: **30/30 PASS**.
- W624D test archive: **10/10 PASS**.
- W624D current-contract alignment: **17/17 PASS**.
- Maintained manifest: **385 files**.
- Dependency-free maintained replay: **372 files / 1,487 outcomes = 1,440 pass + 47 explicit historical skips + 0 failures**.
- Final RT87 changed JS/MJS syntax scan before package docs: **16/16 PASS**.
- Repository secret scan before package docs: **5,497 text files scanned; 0 potential secrets**.
- Semantic diff whitespace check: **PASS**.

The same 13 dependency-backed maintained files remain intentionally deferred to the real checkout after `npm ci`:

- `tests/unit/w649-eoncity-authenticated-entry.test.mjs`
- `tests/unit/w649-eoncity-controllable-core.test.mjs`
- `tests/unit/w649-eoncity-district-runtime.test.mjs`
- `tests/unit/w649-eoncity-asset-acceptance.test.mjs`
- `tests/unit/w649-eoncity-preview-evidence-bridge.test.mjs`
- `tests/unit/w650-eoncity-cache-update-safety.test.mjs`
- `tests/unit/w427-babylon-direct-boot.test.mjs`
- `tests/unit/city-noir-architecture.test.mjs`
- `tests/unit/w455a-noir-world-composition.test.mjs`
- `tests/unit/w456a-noir-readable-guide-cast.test.mjs`
- `tests/unit/w613-eon-city-final-red-team.test.mjs`
- `tests/unit/w660f-city-nexus.test.mjs`
- `tests/unit/w660x-premium-nexus-realms.test.mjs`

These are not skips from release certification. Codex must execute them after dependencies are installed.

## 4. Real-checkout apply order

In the real repository:

```bash
git fetch --all --prune
git switch chatgpt/launch95
git status --short
git rev-parse HEAD
```

Expected committed base before the exported continuation:

```text
cb532648f6942eca555dacd1d20d6a4260ac0678
```

If the branch has moved, compare trees and preserve owner work. Do not force-reset an unknown branch.

The final Codex handover carries patches in chronological order:
1. inherited W76→W80 continuation if the real checkout still needs it;
2. RT81→RT86 patch;
3. RT87 patch.

For RT87 specifically:

```bash
git apply --check EONAPP_LAUNCH95_RT87_FINAL_DELTA_FROM_RT86_2026-08-11.patch
git apply EONAPP_LAUNCH95_RT87_FINAL_DELTA_FROM_RT86_2026-08-11.patch
git diff --check
git status --short
```

Do not apply RT87 on a source that has not first reached the RT86 semantic state.

## 5. Installed source/build certification — mandatory

Maintained runtime: Node 22.

```bash
node --version
npm ci
npm run qa:rt87-push-device-cost
npm run qa:rt86-retention-scale
node scripts/a15-i21-cloudflare-d1-migration-gate.mjs
npm run qa:institutional-ai-v2
npm run qa:launch95-final
npm run qa:w624d-test-archive
npm run qa:w624d-current-contract-alignment
node scripts/run-current-unit-suite.mjs
npm run verify:codex-predeploy
npm run build
```

Also run the maintained secret scan, ESLint/current predeploy aliases and built-artifact gates available in the real checkout. No unexplained generated files may enter the release commit.

Required Git evidence:

```bash
git diff --check
git status --short
git diff --stat
git rev-parse HEAD
git rev-parse HEAD^{tree}
```

## 6. Cloudflare notification architecture — final decision

Keep the RT86 architecture:

`D1 due-reminder authority -> 1-minute scheduler -> Cloudflare Queue -> bounded Worker consumer -> Web Push`

Cost/scale controls now include RT87 device entitlements:
- one pending service reminder/account;
- Free/Trial only one push device;
- paid device cap scales 2/3/4/5 by plan;
- Queue release up to 5,000 due reminders/minute;
- Queue batch 50;
- Queue consumer max concurrency 10;
- at most four reminders concurrently inside one Worker invocation;
- max five devices only on Max paid authority;
- new terminal reminder rows deleted immediately;
- bounded cleanup for legacy terminal/disabled rows;
- Queue is the burst buffer; do not raise concurrency simply because Queue supports more.

The shared identity D1 remains the component to monitor first at very large scale. Follow the RT86 internal guardrails for later push-D1 isolation when real metrics justify it.

## 7. Preview Cloudflare setup — mandatory before Production

Follow `CODEXDocs/EONAPP_RT86_CLOUDFLARE_RETENTION_PUSH_LAUNCH_2026-08-11.md` plus the RT87 policy document.

Handover source state:

| Surface | Preview | Production |
|---|---|---|
| Pages `EON_PUSH_ROLLOUT` | `testing` | `disabled` |
| Retention Worker `EON_PUSH_ROLLOUT` | `testing` | `disabled` |
| Retention Worker Cron | `* * * * *` | `[]` |

Preview proof order:
1. inspect and apply identity migrations through `0005_notification_scale_indexes.sql`;
2. prove identity schema authority version 5;
3. create Preview Queue + DLQ;
4. generate a Preview VAPID/custody keyset with the maintained secret generator;
5. install the exact same Preview push keyset into Pages Preview and Worker Preview;
6. deploy Preview Pages + Preview Worker;
7. enable device alerts in an authenticated browser;
8. close the tab and prove a self-test push;
9. schedule the documented five-minute service reminder;
10. close the tab and prove Cron -> Queue -> Worker -> Web Push;
11. prove Queue drains, DLQ stays empty, no duplicate delivery, notification-click re-entry works, and terminal reminder cleanup occurs;
12. prove a Free/Trial account cannot retain more than one active push device.

For paid-tier RT87 proof, use a separate non-production billing D1 containing controlled test entitlement rows, or another isolated supported test path. **Do not connect Preview to Production billing.**

## 8. Dodo lifecycle / RT87 proof

Before Production notification activation, prove in a safe environment:
- Free enrollment of device A succeeds;
- Free enrollment of device B disables the older excess device, leaving one active;
- Plus active allows two; third enrollment prunes to newest two;
- Studio/Power/Max resolve 3/4/5 respectively;
- `cancelling` retains the paid allowance through the paid period;
- trial/grace/past_due/revoked/disputed/expired fall back to one;
- plan downgrade immediately re-prunes when push rollout is active;
- billing event application remains idempotent if push pruning requires provider retry;
- missing billing authority fails closed to one device;
- browser request data cannot override tier or cap.

## 9. Owner-machine Launch95 browser proof

Carry forward the inherited W80 **35-case owner-machine proof matrix** unchanged unless a newer gate explicitly supersedes a line. At minimum prove authenticated Chrome, Edge, mobile landscape/touch, Command Hub first playable frame, Worlds, Signal Frontier, My Frontier, Storm Sector, productive missions, EONBOT, Creator, share/capture, cold/warm cache, Lite/Balanced/Cinematic FPS, 10-transition soak, service-worker update behavior and zero blocking first-party console errors.

The source readiness score is not a substitute for rendered visual acceptance.

## 10. Production notification promotion

Production remains inert in the handed-over source. After all installed/Preview/browser proofs pass:

1. Generate a NEW Production push keyset.
2. Create Production Queue + DLQ.
3. Inspect/apply Production D1 migrations and prove identity schema v5.
4. Install the same Production push keyset into Pages Production + Worker Production.
5. Re-prove Production Dodo entitlement reads without exposing secrets.
6. Change Pages Production `EON_PUSH_ROLLOUT=disabled` -> `production`.
7. Change Worker Production `EON_PUSH_ROLLOUT=disabled` -> `production`.
8. Change Worker Production `triggers.crons=[]` -> `triggers.crons=["* * * * *"]`.
9. Rerun RT87, RT86, A15 I21, Launch95, maintained suite, build/predeploy and browser gates.
10. Commit the exact promotion diff.
11. Deploy Pages main + Worker Production.
12. Prove one production self-test and one five-minute production reminder on an owner device.
13. Observe D1/Queue/Worker errors, latency, backlog and DLQ before broad launch.

## 11. Notification-only rollback

If push is unhealthy while core EONAPP is healthy:
1. Pages Production rollout -> `disabled`;
2. Worker Production rollout -> `disabled`;
3. Worker Production Cron -> `[]`;
4. redeploy configs;
5. pause Queue delivery if needed and preserve evidence before purge;
6. do not delete encrypted subscriptions unless custody/security requires it;
7. keep core EONAPP online if unaffected.

## 12. Final acceptance rule

RT87 is the last ChatGPT cost-control wave. No further feature expansion is authorized before Codex certification.

Release only after Codex returns:
- clean real Git evidence;
- `npm ci` and all 385 maintained tests including the 13 dependency-backed files;
- RT87/RT86/A15 I21/Institutional AI/Launch95 gates clean;
- build/predeploy clean;
- Preview closed-tab Web Push and five-minute Queue proof clean;
- RT87 one-device Free/Trial proof and paid downgrade proof clean;
- authenticated Chrome + Edge + mobile owner proof clean;
- FPS/cache/10-transition soak clean;
- no blocking first-party console errors;
- owner acceptance.

Only then perform the explicit Production notification promotion.
