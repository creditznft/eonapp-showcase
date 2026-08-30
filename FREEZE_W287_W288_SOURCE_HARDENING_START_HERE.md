This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# W287/W288 Source Hardening Freeze — Start Here

## What this freeze is

A source-only continuation freeze built on the verified W263/W264/W281/W285 hardening baseline. It adds two constrained, reversible source baselines:

- **W287-A0:** local default-off EONBOT voice, continuous voice, and personal greeting controls; local reply-language choice and reset; no hidden microphone or remote interaction data.
- **W288-A0:** local review-only Creator ordinary-work handoff inspection; no import, overwrite, restore, publish, ownership proof, or external transfer.

It does **not** make EONAPP launch-ready, externally audited, beta-ready, chain-ready, referral-ready, Cloudflare-ready, or Lighthouse-verified. W260 remains **NO-GO**.

## Read first

1. `PACKAGE_VALIDATION_W287_W288_SOURCE_HARDENING_2026-06-25.md`
2. `CHANGELOG_W287_W288_SOURCE_HARDENING_2026-06-25.md`
3. `docs/W260_R3_W255_W290_CANONICAL_CONTINUATION_PLAN_2026-06-25.md`
4. `docs/W287_EONBOT_LANGUAGE_VOICE_EVIDENCE_PLAN_2026-06-25.md`
5. `docs/W288_CREATOR_HANDOFF_INTEGRITY_EVIDENCE_PLAN_2026-06-25.md`
6. `release-evidence/W260_RELEASE_BOARD_2026-06-25/RELEASE_BOARD.json`
7. `release-evidence/W287_EONBOT_LANGUAGE_VOICE_SOURCE_READINESS_2026-06-25/W287_BOARD.json`
8. `release-evidence/W288_CREATOR_HANDOFF_INTEGRITY_SOURCE_READINESS_2026-06-25/W288_BOARD.json`

## Reproduce

```bash
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w287-eonbot-language-voice
npm run qa:w288-creator-handoff-integrity
npm run qa:w260-release-board
npm run qa:current-static-certification:tail
```

## Latest local receipts

- 261/261 approved current-product unit tests pass.
- ESLint has zero warnings.
- Production build reports 194 output files.
- W287/W288 and retained source hardening gates pass.
- Static smoke/site/PWA/launch-invariant gates pass.
- Workspace secret scan is clean.
- `npm audit --omit=dev` reports zero known production vulnerabilities.

## Lighthouse rule

Do **not** use this sandbox for Lighthouse scoring. Its managed Chromium process reaches the local server but then returns `chrome-error://chromewebdata/` and `NO_NAVSTART`. No route has a valid score. Use a normal browser-capable desktop/mobile environment for W282 and preserve raw reports outside source control.

## Stop conditions

Do not enable referral/milestone behavior, mutate Cloudflare/D1, deploy a deferred backend/migration, add browser chain/wallet/signing runtime, add hidden EONBOT tools, begin automatic handoff import, claim voice/language/accessibility proof, start beta, or claim launch readiness from this freeze.
