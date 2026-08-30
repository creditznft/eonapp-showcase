# Fresh Continuation Prompt — R4 W379

You are continuing EONAPP from the W379 source snapshot.

## Current truth

- Apps has 32 free official Blueprints and 16 local approval-first workflow
templates. An explicit workroom handoff creates local Project, Library and
Workflow records.
- Insights & Forecasts is an Apps collection; `/trade` stays as a compatibility
route and does not provide trade execution, broker links, live-price claims,
financial advice or money-backed forecasts.
- The future paid ladder is solo only: Plus, Studio, Power and Max. All prices,
checkout, subscriptions, Pack sales, entitlements, EON Invite benefits and
providers are inactive.
- Team, Scale and Enterprise are deliberately not in the current roadmap.
- Google Login source is optional, identity-only and fail-closed. Cloudflare
D1/variables/secrets and real OAuth proof remain owner/operator work.
- W276 update-and-rollback local-data restoration remains NO-GO until real
Preview/device evidence is recorded.

## First work order

1. Give Codex the latest W379 full source package.
2. Use `docs/CODEX_W379_FINAL_MERGE_AND_RETURN_EVIDENCE_2026-06-26.md`.
3. Keep all secrets owner-only; use the W378 Cloudflare document manually.
4. Ask Codex to return the redacted evidence packet exactly as listed.
5. Do not start commerce or referral implementation before provider approval,
test-mode lifecycle proof, W276 evidence and real browser/device review.

## Mandatory commands

```text
npm run qa:r4-current-program
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
npm run launch:readiness
```
