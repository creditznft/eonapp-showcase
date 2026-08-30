# EONAPP W640 — Final owner GO/NO-GO certification and launch handover

## Goal

Issue one explicit owner-reviewed GO or NO-GO decision for the exact W639-certified source and production deployment. W640 must not convert source certification, local builds, synthetic fixtures or missing evidence into launch approval.

## Required inputs

1. The authoritative W639 source checksum, certifying fingerprint, dependency lock and W639 freeze manifest.
2. The W638 redacted evidence index with independent billing, referral, local Creator, Direct BYOK and companion lane verdicts.
3. The W639 whole-app rehearsal board covering routes, account, projects, Forge, automations, City, Creator, billing, referral, backup/recovery and incidents/rollback.
4. Fresh production screenshots, browser/device receipts, Lighthouse/accessibility evidence and Cloudflare deployment/rollback evidence.
5. Independent security review plus owner visual, commercial, privacy and support approval.

## Decision rules

- `GO` is allowed only when every mandatory lane and rehearsal domain is PASS for the exact frozen source/deployment.
- `NO-GO` is mandatory when any required lane is NO-GO, NOT-RUN, stale, unreviewed or tied to a different source/deployment digest.
- Source, synthetic, mocked or screenshot-only evidence cannot certify a payment, provider, referral, restore or production incident lifecycle.
- No destructive customer/payment action is executed without explicit prior owner approval.
- The final receipt must name every blocker and preserve rollback/operations instructions.

## Permanent source command

```bash
npm ci
npm run verify:codex-predeploy
```

## Current starting truth

```text
W638 production evidence: NOT-RUN
W639 production rehearsal: NOT-RUN
W639 launch candidate: NOT FROZEN
W640 starting decision: NO-GO
```
