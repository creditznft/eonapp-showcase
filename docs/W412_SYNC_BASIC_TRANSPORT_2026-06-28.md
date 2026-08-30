# W412 — EON Sync Basic manual-proof transport

**Status:** source/build implementation only; not a public release.

W412 completes the code boundary needed for an honest manual proof of EON Sync Basic. It remains separate from Google Login: Google identity supplies only an opaque signed-in account session. It does not automatically back up Chat, projects, City state, settings, files, Vault, API keys, media, models, caches, wallet/payment data, referral/reward state, or unknown browser storage.

## What the source now includes

- a dedicated `EON_SYNC_DB` D1 schema for six approved safe record types only: preferences, chat metadata/text, project metadata/text, and Share/Remix metadata;
- fail-closed status, record read/write and tombstone endpoints;
- a browser client that never makes a network request at import time and requires a visible action plus separate upload/deletion consent;
- review-only conflict helpers: low-risk metadata can use explicit last-write-wins review, while text produces a conflict-copy requirement rather than silent overwrite;
- a Settings availability check that makes one explicit status request only. It cannot upload, merge, delete or restore work.

## Required Cloudflare activation boundary

Do **not** bind this in production as a public feature yet. Codex must create a new dedicated D1 database, apply `sync/migrations/0001_eon_sync_basic.sql`, and bind it as `EON_SYNC_DB`. The transport stays disabled unless all of the following are present on the same deployment:

- the identity-only Google configuration is genuinely working;
- `EON_SYNC_ROLLOUT=manual-proof`;
- `EON_SYNC_MUTATION_GATE=reviewed`;
- the dedicated D1 binding is present.

The `sync/wrangler.sync.example.toml` file is a template only; it contains no credential and must not be copied as a public-release configuration.

## Manual two-device proof still required

Use a disposable approved Google test account, two isolated browser profiles/devices, and only public-safe test text. Capture a redacted proof of: explicit local migration review, explicit upload, empty-device import/merge choice, offline edit/reconnect behavior, text conflict-copy behavior, tombstone propagation, sign-out/in retention, and empty-target recovery/restore. Do not claim Sync is public, seamless, encrypted end-to-end, or live until this evidence exists.

## Secure Vault Sync remains locked

Vault/API-key Sync is excluded from W412. It requires a separate client-side E2EE design, recovery/passphrase or device-pairing approach, device revocation, encrypted export/recovery kit, threat model, retention policy, and restore proof on an empty device.
