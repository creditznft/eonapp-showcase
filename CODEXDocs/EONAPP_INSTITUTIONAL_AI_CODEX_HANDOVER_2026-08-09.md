# EONAPP Institutional AI — Codex Deployment & Live Certification Handover

**Date:** 2026-08-09  
**Base authority:** `016e306fe9050a93b17f020a0e9792071dd2ce72`  
**Base tree:** `958fa8e6df22621495bc8e62cd47d146f895c72f`  
**Working branch:** `local/institutional-ai-r0-r15-20260809`  
**Production changed by ChatGPT:** **NO**  
**Production deploy authorized by source:** **NO — Codex must prove Preview first.**

## 1. Codex start rule

Work from the supplied final source snapshot exactly as delivered. Do **not** reconstruct from old PRs or re-run old design work. Preserve the institutional AI authority and use the test runner below as the canonical local/source certification entry point.

```bash
node scripts/institutional-ai-final-local-certification.mjs
```

For easier diagnosis, run one tier at a time:

```bash
node scripts/institutional-ai-final-local-certification.mjs --tier=authority
node scripts/institutional-ai-final-local-certification.mjs --tier=core
node scripts/institutional-ai-final-local-certification.mjs --tier=media
node scripts/institutional-ai-final-local-certification.mjs --tier=retention
node scripts/institutional-ai-final-local-certification.mjs --tier=security
node scripts/institutional-ai-final-local-certification.mjs --tier=hygiene
```

The runner writes `release-evidence/INSTITUTIONAL_AI_FINAL_LOCAL_CERTIFICATION.json`.

## 2. What changed architecturally

The source now treats **EON Intelligence as the stable brain and models/providers as replaceable workers**. Key implemented areas include:

- first-turn product/capability grounding with contradiction guards;
- consent-led Memory with Off / Ask / Safe Auto, scoped memory, expiry, export/edit/delete;
- device-aware Local AI lifecycle and explicit model-install handoffs;
- request-time Auto / Private / Best / Fast / Economy model selection inside the verified provider envelope;
- explicit model pin override and Private local-only fail-closed behavior;
- provider/runtime capability metadata and local operational/quality evidence without prompt/response storage;
- hard context-window budgeting for smaller models;
- Image + Video local/hosted execution proof parity;
- first-class Music, ACE-Step local generation, hosted BYOK Music, Auto DJ preview, EON Radio;
- Chat → Creator and EONCITY one-tap creation handoffs;
- verified Creator outcome receipts feeding EONCITY missions/XP without private content;
- Share / Remix / Creator-return loops without hidden tracking or fake referral proof;
- opt-in Activity Center + Web Push source architecture with deployment disabled until live proof;
- AI/provider output bounds, provider-error redaction, strict loopback allowlists and session-owned Companion jobs/outputs.

## 3. Identity D1 migrations required before push proof

Apply to **Preview first**:

1. `identity/migrations/0003_push_subscription_authority.sql`
2. `identity/migrations/0004_notification_retention_reminders.sql`

Do not apply Production first. Verify migration state against `eonapp-identity-preview`, then run the authenticated Preview notification tests.

## 4. Push secrets / bindings

Preview and later Production need these secrets/vars for real Web Push proof:

- `EON_PUSH_VAPID_PUBLIC_KEY`
- `EON_PUSH_VAPID_PRIVATE_KEY`
- `EON_PUSH_VAPID_SUBJECT`
- `EON_PUSH_SUBSCRIPTION_ENCRYPTION_KEY`
- D1 binding: `EON_IDENTITY_DB`

`workers/eon-retention-notifications/wrangler.jsonc` deliberately keeps `EON_PUSH_ROLLOUT` set to **`disabled`**. Do not enable it until a real explicit self-test succeeds on Preview with the app tab closed and a safe click reopens EONAPP.

## 5. Live proof matrix — Codex must capture evidence

### Text AI
- Sign in on Preview.
- Verify at least one real hosted BYOK provider with a real model catalogue and reply.
- Verify model policy behavior (Auto plus one contrasting policy such as Fast/Best).
- Verify a pinned model overrides policy.
- Verify Private refuses hosted routing.

### Local AI
- Start a real user-owned Ollama, LM Studio or Jan runtime.
- Use the explicit scan/self-test UI.
- Prove a real EONBOT reply in Chat.
- Prove the same Local AI authority is usable from Creator/EONCITY where applicable.
- No automatic install/download/cloud fallback is allowed.

### Image
- Local ComfyUI: generate, explicit save, reopen, digest proof.
- Hosted BYOK: generate, explicit save, reopen, digest proof.
- Verify Share/Remix only after a real artifact exists.

### Video
- Local ComfyUI: real generation, progress/cancel behavior, save/reopen and playback-to-end proof.
- Hosted BYOK: same proof discipline.
- No optimistic completion receipt is allowed.

### Music / Radio / DJ
- ACE-Step: user-started runtime → explicit model discovery → generate → preview → save/reopen digest proof.
- Hosted BYOK Music: Companion paired, key stored in OS vault, one explicit paid request, audio held only in bounded Companion/browser memory, save/reopen proof.
- Auto DJ: prove local crossfade preview only; **do not claim beat matching/stem mixing/rendered DJ export**.
- EON Radio: prove private session queue and Play Station while the page remains open; **do not claim closed-tab/background music streaming or a commercial catalogue**.

### EONCITY
- EONBOT real reply.
- EONBOT “make image / video / music” intent opens the maintained in-City Creator surface.
- Complete at least one verified Creator mission and explicitly claim XP.
- Prove opening a lane alone gives no XP.
- Prove duplicate/forged progress cannot mint XP.

### Web Push
- Apply Preview D1 migrations and secrets.
- Enable only Preview rollout for the proof.
- Explicitly opt in from the browser.
- Run the authenticated self-test.
- Close the EONAPP tab.
- Capture the OS/browser notification.
- Click it and verify only a safe EONAPP public route opens.
- Then test one explicit return reminder.
- Keep Production rollout disabled until owner acceptance.

## 6. External-proof boundary

Source tests must never be converted into claims that real providers/devices have passed. The following remain **live-proof pending** until Codex captures them on Preview:

- real hosted API output;
- real local LLM output on owner hardware;
- real ComfyUI image/video output;
- real ACE-Step audio output;
- real hosted Music output;
- real closed-tab Web Push delivery;
- authenticated EONCITY end-to-end mission/XP proof.

## 7. Known local-environment limitation

The ChatGPT container previously encountered an internal npm mirror failure for a locked dependency (`ws@7.5.11`), which prevented using `npm ci` as a universal broad-suite recovery path in that environment. Focused Node source/unit gates remained runnable. Codex should use the repository lockfile with its normal package registry/CI environment and treat dependency-install failures separately from product-test failures.

## 8. Service worker authority

`service-worker/eonapp-service-worker.js` is canonical. `sw.js` and `public/sw.js` must remain byte-identical generated mirrors. A Wave-7 red-team run caught and repaired mirror drift. Keep the existing service-worker origin/storage test in the deployment gate.

## 9. Security invariants Codex must not weaken

- no silent provider hopping;
- no silent paid-provider retry;
- no automatic local model download/install;
- no LAN/RFC1918 runtime probing;
- no arbitrary localhost target/port/path;
- no raw prompt/response/key in EONCITY progression receipts;
- no prompt/response storage in adaptive routing evidence;
- no raw provider URL returned for captured Creator media;
- no cross-session Companion job/output access;
- no Web Push enrollment without explicit user action;
- no marketing/custom-message retention worker;
- no EONKEY/referral qualification from mere sharing/clicks/posts;
- no production notification rollout before real closed-tab Preview proof.

## 10. Codex completion deliverables

Codex should return:

1. exact deployed Preview commit/tree/digest;
2. full final-certification runner result;
3. migration receipts for Preview;
4. headed Chrome screenshots/video for every live-proof row above;
5. console/network error summary;
6. real provider/local runtime names/models used (never keys);
7. real generated Image/Video/Music artifact proof receipts;
8. EONCITY mission/XP proof;
9. Web Push closed-tab proof;
10. any defects fixed, with exact commits;
11. final owner-acceptance checklist;
12. only after owner approval, Production deployment receipt.
