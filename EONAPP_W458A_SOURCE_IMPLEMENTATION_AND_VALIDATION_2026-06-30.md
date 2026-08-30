# W458.1 Sync Basic public-status proof — source implementation and validation

## Scope completed in source

- Added an HTTPS-only, explicit post-deploy probe for the public Sync Basic status boundary.
- The probe runs in dry mode unless `--allow-network` is provided.
- It uses only `GET /api/sync/status`, redirects are rejected and browser credentials/cookies are omitted.
- It reads only the minimal transparent status fields needed to prove that Sync remains manual-proof and non-automated. No raw response body is retained.
- It cannot create a D1 binding, authenticate an account, upload/read/delete records, merge conflicts, restore data or grant release approval.

## Intended post-deploy command

```bash
node scripts/w458a-sync-basic-status-proof.mjs \
  --origin=https://eonapp.ch \
  --allow-network
```

Run only after deploying the intended source. A successful response proves a public status boundary only; it does not prove D1 operation or signed-in Sync.

## Validation completed locally

- W458.1 source gate: passed (8 / 8).
- W458.1 unit tests: 4 / 4 passed.
- ESLint: zero errors and warnings after implementation.

## Not claimed

- D1 database creation/binding or Cloudflare Pages environment flags.
- Google session, account ownership, consent, Device A/B upload, merge, tombstone, conflict, clear, restore or rollback proof.
- Vault/credential/payment sync, browser/device privacy approval or live release approval.
