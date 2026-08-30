This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Codex handover — W280-B1 local support evidence pack and final external-evidence boundary

## Authority

- Canonical repository: `creditznft/EONAPP` (private), default branch `main`.
- Use this freeze only after checksum verification.
- **W260 remains NO-GO.** No GitHub merge to a deployment branch, Cloudflare mutation, D1 access/write, or deployment is authorised.

## What W280-B1 adds

The Support page can create a finite local JSON pack for manual sharing:

- current same-app route path only (no query/fragment);
- canonical support topic and coarse browser/device class only;
- redacted expected/actual text;
- visible preview before user confirmation;
- copy/download only after manual review confirmation.

It does not transmit, persist, file, submit, queue, or promise a support response. It is not a security disclosure process.

## Local safety-branch procedure

```bash
git switch main
git pull --ff-only
git switch -c codex/w280-b1-local-support-evidence-pack-2026-06-25
npm ci
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:w280-public-support-narrative
npm run qa:w280-b1-local-support-evidence-pack
npm run qa:w145-update-safe-user-data-survival
npm run qa:w260-release-board
npm run qa:w283-cloudflare-rollback-evidence
npm run qa:w284-referral-activation-decision
npm run qa:w286-b1-city-agent-presence
npm run qa:w286-b2-live-work-command
npm run qa:w286-b3-city-outcome-relay
npm run qa:current-static-certification:tail
```

Create only a reviewable local commit or draft PR after all checks pass. Return commit SHA, package-lock SHA-256, command results, redacted artifact locations, and blockers. Never return keys, tokens, raw user state, referral rows, Cloudflare/D1 IDs, raw IPs, or full configuration output.

## Remaining external-only work

Follow the existing W282/W259/W266/W276 protocol, W283 read-only Cloudflare/D1 prompt, W268/W278/W279 review docket, and W289/W290 board. No source result can close those external evidence lanes.

## Immediate BLOCKED conditions

Stop and return `BLOCKED` if asked to deploy, modify Cloudflare, read or write D1, create tracking/referral/reward flows, access a secret, run a wallet/chain/payment feature, or claim actual support, legal/security, beta, device, restore, Lighthouse, or launch completion without independent evidence.
