This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex handover — W286-B3 final source-safe City closure and external evidence

## Authority and status

- Canonical repository: `creditznft/EONAPP` (private), default branch `main`.
- Use this source freeze as the local implementation authority after verifying its SHA-256.
- **W260 remains NO-GO.** This is not a production deployment, beta, referral/reward activation, D1 migration, wallet/chain, payment, or final-certification package.
- No GitHub write, merge to `main`, Cloudflare mutation, or deployment is authorised by this handover.

## What W286-B3 adds

A finite, privacy-safe City outcome relay:

- City Lite, Three.js Visual Tour, and Babylon City Play show only **Review needed**, **Result ready**, or **Attention needed** when the latest recorded local lifecycle state is waiting, complete, or failed.
- The visual status is sourced only from the existing local lifecycle bridge.
- Native Chat/work surfaces remain the actual review and result location.
- The user explicitly taps **Review in Chat** or **Manage in Chat**; no automatic navigation occurs.
- No prompt, output, transcript, work reference, provider/model identity, account detail, secret, Vault, wallet, payment, referral, personal data, or result payload is shown.

## Local safety-branch procedure

1. Start from a clean local checkout:
   ```bash
   git switch main
   git pull --ff-only
   git switch -c codex/w286-b3-city-outcome-relay-2026-06-25
   ```
2. Verify the archive SHA-256 and extract source only. Do not copy `node_modules`, `dist`, `.env*`, secrets, logs, artifacts, nested archives, or unknown local configuration.
3. Install from the lockfile in your normal local environment:
   ```bash
   npm ci
   ```
4. Run:
   ```bash
   npm run test:unit
   npm run lint -- --max-warnings=0
   npm run build
   npm run qa:w249-babylon-play-proof-spike:dist
   npm run qa:w255-city-parity-registry
   npm run qa:w259-city-preview-evidence
   npm run qa:w265-w286-city-district-expansion
   npm run qa:w286-b1-city-agent-presence
   npm run qa:w286-b2-live-work-command
   npm run qa:w286-b3-city-outcome-relay
   npm run qa:w260-release-board
   npm run qa:w283-cloudflare-rollback-evidence
   npm run qa:w284-referral-activation-decision
   npm run qa:w289-w290-external-evidence-board
   npm run qa:current-static-certification:tail
   ```
5. Create only a reviewable local commit or draft PR after all commands pass. Do not merge or deploy.
6. Return only: commit SHA, package-lock SHA-256, commands/results, redacted evidence file locations, and blockers. Never return tokens, secrets, user state, referral rows, Cloudflare IDs, database IDs, raw IPs, or full configuration output.

## External evidence Codex may coordinate

### W282 — real Lighthouse

Use a normal browser-capable desktop/mobile environment. Build fresh and run the project’s Lighthouse commands. Treat missing reports, `chrome-error://chromewebdata/`, and `NO_NAVSTART` as `ENVIRONMENT_BLOCKED`, not performance scores.

### W259/W266 — physical City proof

Use actual desktop, Android, iPhone/Safari where available, and a lower-capability profile. Cover City Lite, Three.js Visual Tour, Babylon City Play, touch/keyboard/controller, reduced-motion/low-power fallback, empty/focused/parallel/handoff/review/complete/failed lifecycles, and result-review routing. Verify no private output is displayed.

### W276 — observed restore proof

Use a disposable browser profile, non-sensitive synthetic state, same-origin update/restore rehearsal, and exact before/after comparison. Do not use real keys, personal data, referral rows, wallet/chain data, or production user state.

### W283 — owner-only read-only Cloudflare/D1 evidence

Use `docs/CLOUDFLARE_AI_W283_READ_ONLY_EVIDENCE_PROMPT_2026-06-25.md` only when the owner explicitly starts the Cloudflare step. It permits Pages deployment metadata and D1 schema metadata only. It never permits deployment, rollback execution, row reads, migrations, binding changes, Workers, secrets, rewards, referrals, or writes.

### W268/W278/W279

Use `docs/W268_W278_W279_EXTERNAL_REVIEW_DOCKET_2026-06-25.md` to assign named owners/observe drills, obtain qualified legal review, and arrange independent security review.

## Absolute hard stops

Return `BLOCKED` immediately if asked to:

- merge to a deployment-triggering branch, deploy Pages/Workers, edit Cloudflare bindings/settings/environment/secrets, rollback a deployment, or write to D1;
- read/export referral rows, create schema, add click/open tracking, short-link registry, referral/reward/milestone logic, or any value ledger;
- create a wallet, custody, key/seed, signing, RPC, balance, transfer, token/coin, price, exchange, payout, payment, marketplace, or referral value;
- state that beta, Lighthouse, device, restore, legal, security, operations, or final certification is complete without independent evidence.

## Sequence after evidence

Only when independently evidenced: reassess W258 → W261/W262 and W284 → W269. W289 beta and W290 final recertification remain blocked until their entire evidence board is closed by accountable owners.
