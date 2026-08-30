# W645 genuine production evidence workspace

The committed source board remains **NOT-RUN**. Codex creates a temporary private evidence branch from the exact candidate source and adds only redacted evidence under this directory plus W638 artifacts under `evidence/w638/`.

Required files for `npm run evidence:w645-build -- ...`:

- `w638-evidence-index.json` generated from genuine W638 records and existing redacted artifacts;
- `lane-decisions.json` for billing, Local Creator, referral, Direct BYOK and companion;
- `w643-creator-device-board.json` with real owner image/fallback receipts and optional reference-video receipt;
- `w644-city-owner-receipt.json` after manual Google-session and owner visual review;
- `domain-evidence-board.json` with all 11 domains linked to the exact candidate and Preview deployment;
- `kill-switch-receipt.json` from non-destructive Preview rehearsals.

Every domain needs at least one existing artifact under `evidence/w645/` with matching SHA-256 and byte count. Text artifacts are scanned for secrets and email addresses. Never commit `.env.local`, cookies, OAuth state, API keys, full customer/payment identifiers, unredacted account screenshots or absolute local paths.

Cancellation, reactivation, refund, dispute and tier-change tests require documented owner approval **before** the action and designated test accounts. Do not mutate real customers. Do not reset D1 and do not use destructive migration rollback.
