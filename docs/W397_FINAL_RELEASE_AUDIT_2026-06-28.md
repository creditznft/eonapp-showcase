# W397 — Final Release Audit

**Status:** source candidate only. A clean local test/build suite is necessary,
but it is not production evidence and does not certify a release.

## Source suite

Run the scripted release candidate suite:

```bash
npm run verify:w397-release-candidate
```

The command validates strict lint, the current runnable unit suite, W393A
handover integrity, mobile City source rules, local file/voice/creator/share
foundations, identity readiness, restore readiness, build, smoke, static audit
and launch readiness.

## Machine-readable manual blockers

```text
real-device-city-mobile-proof
cloudflare-d1-and-google-testing-proof
manual-encrypted-backup-recovery-drill
preview-and-production-route-observation
dependency-audit-remediation-decision
human-release-signoff
```

## Machine-readable inactive features

```text
collection-and-vault-reveal
eon-relay-referral-grants
social-oauth-and-direct-publishing
server-side-social-token-custody
user-owned-cloudflare-deploy
cloud-media-jobs-or-automatic-sync
```

## Human evidence still required

- Real-phone and narrow-desktop City observation, including touch, safe areas,
  Command Deck, audio/reduced-motion and direct entry.
- Controlled Google OAuth Testing-mode sign-in using only approved test users.
- Dedicated D1 Production/Preview binding and migration proof without exposing
  rows, cookies, credentials, codes or tokens.
- W396 encrypted local backup recovery drill into an empty separate target.
- Preview and Production route observation after a deployment.
- A dependency audit remediation decision: upgrade, replace, accept with a
  documented temporary mitigation, or block release. Do not silently run a
  blanket dependency update.
- Human release sign-off against deployed Privacy, Terms, Support, deletion,
  data-custody, creator-rights and sharing disclosures.

## Current excluded features

Until the above is complete, these remain inactive:

- Collection, Vault Reveals and EON Relay referral grants.
- OAuth social accounts, server-side platform tokens, scheduling or direct
  publishing.
- Cloud creator rendering, cloud media processing, automatic backup, sync or
  account restoration of local work.
- User-owned GitHub/Cloudflare deployment.

## Release decision

Use `assets/js/local-first/w397-release-audit-board.js` only to record
redacted human evidence references. It never certifies a release. The final
release decision must come from a human who has verified the deployed system.

