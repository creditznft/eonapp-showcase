# R4 W379 Start Here — Final Solo Pricing and Codex Evidence Handover

W379 is the current source snapshot. It supersedes W378 and all earlier
W359–W377 packages for future source work.

This is source-only. No Cloudflare setup, Google OAuth proof, payment,
subscription, Pack sale, EON Invite benefit, provider selection or browser /
device release evidence is claimed.

## Read in this order

1. `R4_W379_CONTINUATION_PROMPT.md`
2. `R4_W379_FULL_SOURCE_HANDOVER_STATUS.md`
3. `docs/R4_W379_FINAL_CEO_DECISIONS_AND_LAUNCH_BLOCKERS_2026-06-26.md`
4. `docs/R4_COMM03_SOLO_PRICING_AND_CATALOGUE_DECISION_2026-06-26.md`
5. `docs/CODEX_W379_FINAL_MERGE_AND_RETURN_EVIDENCE_2026-06-26.md`
6. `docs/W378_CLOUDFLARE_GOOGLE_AUTH_AND_CODEX_HANDOFF_2026-06-26.md`
7. `docs/CODEX_W378_MERGE_PREVIEW_PRODUCTION_HANDOFF_2026-06-26.md`

## Verify locally

```bash
node --version
npm ci
npm run qa:r4-current-program
npm run lint -- --max-warnings=0
npm run test:unit
npm run build
npm run smoke:build
npm run audit:site
npm run security:secret-scan
npm run launch:readiness
```

## Current product decision

- Free remains the usable local-first core.
- The future solo ladder is Plus $4.99 / ₹499, Studio $14.99 / ₹1,499,
  Power $29.99 / ₹2,999 and Max $49.99 / ₹4,999, with annual books at roughly
  ten monthly payments.
- Prices are internal planning values only. No price is public or purchasable.
- Team, Scale and Enterprise are not in the current roadmap.
- EON Invite remains a planned single-level non-cash promotion only, pending
  provider approval and server-side reversal proof.
- Guest-first Google Login remains optional identity-only access, never backup.
