# EONAPP Launch95 RT86 — Final Codex Handover Authority

Date: 2026-08-11

## 0. Non-negotiable release state

- Repository: `creditznft/EONAPP`
- Branch authority: `chatgpt/launch95`
- Live ancestor: `7a833c91203c5c1dc82e8529c83a619473d67261`
- Last committed Launch95 HEAD before the exported W76+ continuation: `cb532648f6942eca555dacd1d20d6a4260ac0678`
- **Production has NOT been changed to Launch95 by ChatGPT.**
- This source package is the semantic W80 candidate plus RT81–RT86 repairs.
- Do not infer original Git provenance from the exported ZIP. Apply the supplied final patch in the real checkout and prove the real Git state there.
- Do not deploy Production until every required proof below passes.

## 1. What RT81–RT86 changed

Read:
- `CODEXDocs/EONAPP_RT81_RT86_REDTEAM_SCORECARD_2026-08-11.md`
- `CODEXDocs/EONAPP_RT86_CLOUDFLARE_RETENTION_PUSH_LAUNCH_2026-08-11.md`

High-level changes:
1. City Creator canonical styling/runtime parity while keeping CSS lazy.
2. AI/provider authority, model-discovery and stale-provider fail-closed recovery.
3. Current three-World certification truth.
4. Retired City/browser selectors removed and certification gates hardened.
5. W306 local-first/privacy gate repaired; first-run Explore Worlds improved.
6. RT86 notification redesign for low-cost Cloudflare scale.

## 2. Fresh ChatGPT-side source evidence

- Launch95: **182/182 PASS**.
- Institutional AI v2: **108/108 PASS**.
- RT86 retention scale gate: **23/23 PASS**.
- RT86 unit lane: **5/5 PASS**.
- W624D archive: **10/10 PASS**.
- W624D alignment: **17/17 PASS**.
- Maintained manifest: **384 files**.
- Portable maintained replay: **371 files / 1,484 outcomes = 1,437 pass + 47 explicit skips + 0 failures**.

The following 13 maintained files are intentionally deferred because the exported audit workspace does not contain their exact installed dependency surface. They MUST run after `npm ci` in the real checkout:

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

## 3. Codex apply order — real checkout

Do not code from the exported ZIP as if it were the Git authority. In the real repository:

```bash
git fetch --all --prune
git switch chatgpt/launch95
git status --short
git rev-parse HEAD
```

The expected committed base before applying the final continuation is:

```text
cb532648f6942eca555dacd1d20d6a4260ac0678
```

If the real branch has moved, stop promotion and compare trees first. Do not force-reset unknown owner work.

Apply the supplied final RT81–RT86 patch with whitespace checking:

```bash
git apply --check EONAPP_LAUNCH95_RT81_RT86_FINAL_DELTA_FROM_W80_2026-08-11.patch
git apply EONAPP_LAUNCH95_RT81_RT86_FINAL_DELTA_FROM_W80_2026-08-11.patch
git diff --check
git status --short
```

If the real checkout is instead at the older `cb532648` state without the W76–W80 semantic delta, first restore/apply the W80 continuation from the inherited W80 handover, then apply RT81–RT86. Do not skip W80.

## 4. Install and run the strict source/build gates

Node 22 is the maintained runtime.

```bash
node --version
npm ci
npm run qa:rt86-retention-scale
npm run qa:institutional-ai-v2
npm run qa:launch95-final
npm run qa:w624d-test-archive
npm run qa:w624d-current-contract-alignment
node scripts/run-current-unit-suite.mjs
npm run build
```

Also run the project’s existing secret scan, ESLint/predeploy/build-artifact gates and `verify:codex-predeploy`/current stable aliases. A green exported-source replay is not a substitute for the real installed checkout.

Required Git evidence after gates:

```bash
git diff --check
git status --short
git diff --stat
git rev-parse HEAD
git rev-parse HEAD^{tree}
```

Keep generated receipts separate from product-source changes. No unexplained files may enter the final commit.

## 5. Cloudflare Preview push proof — mandatory before Production

Follow the exact operational document:

`CODEXDocs/EONAPP_RT86_CLOUDFLARE_RETENTION_PUSH_LAUNCH_2026-08-11.md`

Critical source state as handed over:

| Surface | Preview | Production |
|---|---|---|
| Pages `EON_PUSH_ROLLOUT` | `testing` | `disabled` |
| Retention Worker `EON_PUSH_ROLLOUT` | `testing` | `disabled` |
| Retention Worker Cron | `* * * * *` | `[]` |

Production therefore has **two independent source brakes**: rollout disabled and scheduler removed.

Preview proof order:
1. inspect/apply identity migration `0005_notification_scale_indexes.sql` to Preview D1;
2. create Preview Queue + DLQ;
3. generate a Preview VAPID/custody keyset with `npm run push:generate-secrets -- --json --subject ...`;
4. install the exact same four Preview values into Pages Preview **and** Worker Preview;
5. deploy Preview Pages and Worker Preview;
6. authenticated browser: enable device alerts;
7. close the tab and prove self-test notification;
8. schedule the five-minute service reminder from the documented owner console call;
9. close the tab and prove real Cron -> Queue -> Worker -> Web Push;
10. prove Queue drains, DLQ remains empty, no duplicate delivery, safe notification-click re-entry and D1 row cleanup.

Do not use service reminder consent for bulk marketing. RT86 intentionally implements explicit one-time service reminders only.

## 6. Owner-machine Launch95 browser proof

Carry forward the W80 owner-machine runbook and its **35 unique proof cases**. At minimum, prove:

- authenticated Chrome;
- authenticated Edge;
- mobile landscape/touch;
- Command Hub first playable frame;
- Welcome dismiss / Explore Worlds / Menu / EONBOT choices;
- Signal Frontier entry, tasks, productive mission handoffs and return continuity;
- My Frontier starter access and fixed-placement build workflow;
- Storm Sector release truth and entry;
- EONBOT companion continuity, composer, voice/AI entry boundaries;
- Creator Image/Video/Music canonical work surface;
- Share/capture paths;
- cold boot vs warm immutable City-asset reuse;
- Lite / Balanced / Cinematic FPS evidence;
- 10-transition Hub <-> World soak;
- first-party console errors separated from extension noise;
- service-worker update/cache proof;
- no loading/preparing dead-end;
- no major viewport overlap/camera obstruction/black-wall regression.

The W80 runbook is included unchanged in the final handover as inherited evidence. Use it as the detailed browser checklist unless a newer source gate explicitly supersedes a line.

## 7. AI proof

Source authority is strong, but Codex/owner machine must still prove real credentials/transports where available:

- at least one current hosted chat provider;
- local AI localhost path where owner environment supports it;
- model discovery and saved-model fallback;
- disabled-provider fail-closed behavior;
- City EONBOT uses canonical AI execution;
- Create Image/Video/Music surface opens correctly and does not claim unsupported server generation;
- BYOK secrets remain local/Vault-custodied according to maintained contracts.

Do not revive disabled Cohere/Anthropic/NVIDIA/SambaNova browser adapters merely to increase provider count. Runtime governance is authoritative.

## 8. Cloudflare cost/scale decision

RT86 intentionally uses **D1 + Queues + one bounded Worker**, not one Cron per user, Durable Objects per user, or a high-write success heartbeat.

Current source limits:
- one pending service reminder/account;
- max five active device subscriptions/account;
- release up to 5,000 due reminders/minute;
- Queue consumer batch 50;
- Queue max concurrency 10;
- up to four reminders concurrently inside one Worker invocation;
- new delivered/cancelled reminder row deleted immediately;
- seven-day legacy terminal/disabled-subscription cleanup only.

The Queue is deliberately the burst buffer. Do not raise `max_concurrency` simply because Queue can scale higher: the shared identity D1 is the resource we are protecting.

Operational policy:
- observe D1 rows read/written, size, latency/overload errors;
- observe Queue backlog/retries/DLQ;
- keep push messages compact;
- start a dedicated push-D1 isolation plan around sustained ~6GB shared identity DB size and complete before ~8GB; those are EONAPP internal guardrails, not Cloudflare product limits;
- split D1 for capacity/isolation only when metrics justify it.

## 9. Production promotion

Production promotion is a separate explicit change. After every Preview/browser/performance proof passes:

1. Generate a NEW Production keyset.
2. Create Production Queue + DLQ.
3. Inspect/apply Production identity migrations.
4. Install the same Production keyset into Pages Production + Worker Production.
5. Change Pages Production rollout `disabled` -> `production`.
6. Change Worker Production rollout `disabled` -> `production`.
7. Change Worker Production `triggers.crons` from `[]` -> `["* * * * *"]`.
8. Rerun the full source/build/browser/RT86 gates.
9. Commit the exact promotion diff.
10. Deploy Pages main + Worker Production.
11. Prove one production self-test and one five-minute production Queue reminder on the owner device.
12. Watch D1/Queue/Worker errors/backlog before broad launch.

No production promotion is authorized merely by possession of this handover.

## 10. Emergency notification rollback

If retention push is unhealthy while core EONAPP is healthy:

1. set Pages Production rollout to `disabled`;
2. set Worker Production rollout to `disabled`;
3. set Worker Production `triggers.crons=[]`;
4. redeploy both configs;
5. pause Queue delivery if required; capture evidence before purge;
6. do not delete encrypted user subscriptions unless custody/security demands it;
7. keep the core City/AI application online if unaffected.

## 11. Final acceptance rule

The red-team source candidate scores **9.55/10 source readiness**. Do not convert that into a claimed rendered 9.5/10 launch until Codex returns:
- clean real Git evidence;
- installed dependency/build gates;
- all maintained tests;
- Chrome + Edge + mobile owner proofs;
- FPS/cache/soak proof;
- Cloudflare Preview closed-tab + five-minute Queue proof;
- no blocking first-party console errors;
- owner acceptance.

Then and only then perform the explicit Production promotion diff.
