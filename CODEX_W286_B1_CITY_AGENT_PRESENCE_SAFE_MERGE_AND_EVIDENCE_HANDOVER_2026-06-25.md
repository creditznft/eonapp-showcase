This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex handover — W286-B1 City Agent Presence and remaining external evidence

## Source package role

This freeze contains source-only W286-B1 Agent Presence wiring on top of the verified W265/W283/W284/W286 baseline. It is **not** authorised for public deployment, referral activation, Cloudflare/D1 changes, wallet/chain work, beta, or final certification.

## GitHub target

Canonical repository: `creditznft/EONAPP` (private, `main`).

## Local merge procedure

1. Unzip into a new local workspace; do not overlay unknown local changes.
2. `npm ci`
3. Create a local branch, for example `codex/w286-b1-agent-presence-2026-06-25`.
4. Run:
   ```bash
   npm run test:unit
   npm run lint -- --max-warnings=0
   npm run build
   npm run qa:w286-b1-city-agent-presence
   npm run qa:w265-w286-city-district-expansion
   npm run qa:w283-cloudflare-rollback-evidence
   npm run qa:w284-referral-activation-decision
   npm run qa:current-static-certification:tail
   ```
5. Compare the output against this package’s manifest and validation note.
6. Create a reviewable local commit/PR only after all commands pass. Do not merge directly to `main` and do not deploy from this handover.

## Read-only Cloudflare/D1 work permitted after local verification

Run the existing `HANDOFF/W283_W284_CLOUDFLARE_D1_EVIDENCE_2026-06-25/CODEX_READONLY_CLOUDFLARE_AND_D1_PROMPT.md` only in its exact read-only mode. It may return redacted Pages deployment metadata, D1 database names, and `sqlite_master` schema metadata.

It must not read user rows, create a table, migrate D1, bind or deploy a Worker, inspect secrets, capture referral opens/clicks, add a short-link registry, create a reward ledger, enable milestones, or mutate production.

## Required external evidence before the next product decision

- W282: Lighthouse desktop/mobile on a normal browser-capable machine; save raw reports outside Git.
- W259/W266: real visual/device proof, including City Lite/Three.js/Babylon with genuine task signals.
- W276: observed update/restore proof.
- W268: named owners and observed operations drills.
- W278: qualified legal/compliance review.
- W279: independent security review.

## Hard stops

Do not start W261/W262 runtime implementation, W269 beta, W284 referral activation, W289 beta review, or W290 final certification without the independent evidence above. EON Lite remains a future concept only: no coin, token, wallet, balances, custody, signing, transfers, prices, payments, referral value, or rewards.
