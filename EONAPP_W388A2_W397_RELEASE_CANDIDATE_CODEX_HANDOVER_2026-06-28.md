This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP — W388A.2 to W397 Release-Candidate Handover

**Date:** 2026-06-28  
**Baseline:** W404 / W388A.1 creator-foundation continuation  
**Latest source state:** W388A.2, W388A.3, W395, W396, W397  
**Status:** runnable source candidate; not production-certified.

## What was added in this continuation

### W388A.2 — Remix Cards
- Local, public-safe text/JSON starter packs for campaign briefs, content series,
  Forge starters and video storyboards.
- Copy, local JSON export and device-native share only.
- No hosting, public page, account transfer, source/file/media transfer,
  analytics, referral attribution, reward, collaboration claim or direct post.
- Local/private URLs and secret-shaped text are rejected.

### W388A.3 — EONBOT “make it shareable” flow
- Explicit user wording maps to a visible EONBOT CTA.
- A click writes only a bounded, short-lived browser-session intent.
- Workspace Share Pack / Remix Card can prefill from that intent.
- No chat body, attachment, credential, account, provider key, media file,
  referral ID, social token or tracking context is passed through.

### W395 — Google Identity + D1 deployment readiness
- Existing W373/W374 identity-only Pages Function source is now wrapped in a
  strict W395 readiness contract, source gate, operator runbook and placeholder
  binding template.
- Google/D1 is **not live-certified**. Guest mode remains available.
- Identity only uses `openid email profile`; no Google product scopes.
- Identity is not a backup/sync/local-work restore mechanism.

### W396 — update, rollback and restore readiness
- Adds a redacted evidence-board helper and explicit manual recovery checklist.
- Reuses existing byte-exact local update-simulation, encrypted local backup and
  separate-empty-target recovery primitives.
- No automatic backup/sync, no destructive overwrite and no account-based local
  work restore.

### W397 — final source release audit
- Adds a transparent source-candidate audit, six manual blockers, and one full
  `verify:w397-release-candidate` command.
- Source success remains distinct from production release approval.

## Verification completed in this source workspace

```bash
npm run verify:w397-release-candidate
```

Result: **PASS**

- strict lint: pass
- W393A handover-integrity: pass
- W394 City mobile/HUD source gate: 9/9
- W382B/W383B file viewers: 8/8
- W394B multilingual voice: 9/9
- W400/W402 creator adapters: 10/10
- W401 provenance: 8/8
- W403 lean media lifecycle: 8/8
- W404 City Creator Atrium: 11/11
- W388A.1 Share Pack: 9/9
- W388A.2 Remix Cards: 10/10
- W388A.3 EONBOT shareable flow: 8/8
- W395 Google/D1 source readiness: 38/38
- W396 restore source readiness: 10/10
- W397 source release audit: 27/27
- current runnable unit suite: **316/316**
- build, smoke, static site audit and launch readiness: pass

The lean handover deliberately does **not** certify 12 historic evidence/archive
tests that require original forensic release bundles not included in this source
package.

## Before any deploy or public claim

1. Resolve the dependency audit decision. Current `npm audit` result: 6 findings
   (4 high, 1 moderate, 1 low), affecting development/deployment tooling
   including Wrangler/miniflare/undici/ws and build dependencies. Do not run an
   unreviewed blanket `npm audit fix`.
2. Apply the W395 Cloudflare/Google procedure in:
   - `docs/W395_GOOGLE_IDENTITY_D1_DEPLOYMENT_READINESS_2026-06-28.md`
   - `docs/CLOUDFLARE_AI_GOOGLE_IDENTITY_SETUP_PROMPT_2026-06-26.md`
3. Keep Google OAuth in Testing mode. Use only the exact production callback and
   approved test users. Keep Preview OAuth disabled.
4. Complete the W396 encrypted backup/restore drill in a real browser.
5. Complete the W394 real-device City observations on phone and narrow desktop.
6. Complete the W397 deployed Preview/Production route observation and human
   release sign-off.

Never paste secrets, OAuth codes, cookies, tokens, D1 rows, raw browser storage
or encrypted backup passphrases into Codex, ChatGPT, source files or proof.

## Explicitly inactive after this handover

- Collection, deterministic Vault Reveal and EON Relay referral grants.
- Any cash, credits, coupons, paid-feature time, payout, resale, marketplace,
  crypto or NFT behavior.
- Social OAuth, platform token storage, posting, scheduling and analytics.
- Cloud creator rendering/processing, automatic backup/sync and account recovery
  of local work.
- GitHub App connection and user-owned Cloudflare deployment.

## Next source work only after manual gates are evidenced

1. **W390A/B Collection + deterministic Vault Reveal**
   - Account-bound/non-transferable product progression.
   - Exact mission evidence; no chance, paid opening, market, token or financial value.
2. **W391A/B/C EON Relay pilot**
   - Direct verified activations only, cap, reversal/abuse ledger, no clicks,
     no signup-only grants, no cash/credits/free time.
3. **W406/W407 Action Gateway / durable execution**
   - Explicit approvals, safe receipts and server-side action boundary.
4. **W388B/C/D social connectors**
   - Architecture first; then platform-by-platform official OAuth/API proof;
     every post user-reviewed and user-confirmed.
5. **W389 GitHub + Cloudflare deployment** after Forge ownership and policy proof.
6. **W398/W399 measurement + creator/remix pilot refinement** after a safe pilot.
