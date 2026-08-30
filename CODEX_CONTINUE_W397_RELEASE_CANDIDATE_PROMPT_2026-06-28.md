This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex Prompt — Continue EONAPP From W397 Source Candidate

You are continuing from the lean source bundle containing the latest completed
state through **W397 source release audit**.

## First commands — do not skip

Use Node 22.

```bash
npm ci
npm run verify:w397-release-candidate
```

Do not deploy, change dependencies, activate OAuth, Collection, referrals or
social posting until the command passes and the manual blockers below are
separately handled.

## Current completed source work

- W394 City mobile/touch/HUD source implementation.
- W382B/W383B local file preview foundation.
- W394B local language choice for browser speech recognition.
- W400/W401/W402/W403/W404 creator model adapter truth, provenance, lean-media
  lifecycle and Babylon Creator Atrium / Forge Bay entry points.
- W388A.1 Share Pack, W388A.2 Remix Cards, W388A.3 EONBOT shareable handoff.
- W395 identity/D1 source readiness; W396 restore readiness; W397 release audit.

## Hard boundaries

Do not enable or fake:

- Google Login live, D1 live, cloud backup, cross-device sync or account restore
  of local work.
- Collection, Vault Reveal, EON Relay referrals, reward grants, credits,
  coupons, paid feature time, cash or financial value.
- OAuth social connections, direct post, scheduling, social analytics, platform
  token storage or auto-posting.
- Any blanket “fair use downloader,” external video download or rights claim.
- GitHub/Cloudflare user deployment before its later proof gates.

## External manual blockers

See `docs/W397_FINAL_RELEASE_AUDIT_2026-06-28.md` and
`docs/W395_GOOGLE_IDENTITY_D1_DEPLOYMENT_READINESS_2026-06-28.md`.

The operator must complete:

1. Dependency audit remediation decision.
2. Separate D1 Production/Preview databases and binding `EON_IDENTITY_DB`.
3. Google OAuth Testing-mode proof with the exact production callback.
4. Real device City observations.
5. Encrypted local backup recovery drill into an empty target.
6. Deployed Preview/Production route observation and a human release decision.

## Only after documented manual proof

Implement in order:

1. W390A/B Collection + deterministic non-financial Vault Reveal.
2. W391A/B/C capped, verified direct EON Relay pilot.
3. W406/W407 approval-first durable action foundation.
4. W388B/C/D official social connector architecture and one-platform-at-a-time proof.
5. W389 GitHub/Cloudflare user deployment.
6. W398/W399 measurement and pilot refinement.

Every source change must add a truthful gate and test, run strict lint, current
unit suite, build, smoke, audit site and launch readiness. Do not certify a live
service from source-only tests.
