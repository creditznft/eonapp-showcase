# W396 — Update, Rollback and Restore Proof

**Status:** source readiness only. This document is not a deployment receipt and
cannot certify a real browser, Cloudflare release, Google account, D1 database,
backup file, restoration result, or rollback.

## Release rule

A new deployment may replace application assets and service-worker caches. It
must not clear browser-local EONAPP state or silently transform user-owned work.
Before any risky update, the user should create an explicit encrypted backup for
work they cannot lose. Google identity is not a backup, sync or local-work
restore service.

## Machine-readable manual lane IDs

```text
pre-update-local-storage-manifest
cold-start-after-deploy
encrypted-backup-export
encrypted-backup-recovery-drill-into-empty-target
rollback-or-last-known-good-recovery
guest-and-identity-local-work-boundary
redacted-real-browser-evidence
```

## Required real-browser proof lanes

1. Capture a redacted pre-update local-state survival manifest.
2. Cold-start the new deployment in the same browser profile.
3. Verify intended local app state remains available after the update.
4. Create an explicit encrypted local backup. Do not upload it automatically.
5. Restore that backup into a separate empty target. Never overwrite an
   existing target during the drill.
6. Verify the last-known-good rollback or recovery procedure preserves the same
   local-only boundary.
7. Verify optional Google identity does not upload, merge, restore or claim
   recovery for Chat, Vault, provider keys, local files, projects, City state,
   automations or creator media.
8. Save redacted evidence references only. Never retain passphrases, cookies,
   token values, raw manifests, private file contents, screenshots of secrets,
   D1 rows or full browser storage dumps.

## The source implementation

- `assets/js/utils/update-safe-user-data.js` models byte-exact local state
  preservation across a simulated asset update and redacts secret values.
- `assets/js/eon-sync/eon-sync-backup.js` produces an explicit encrypted local
  backup and only restores allowlisted non-secret records.
- `assets/js/local-first/eon-portable-backup.js` supports encrypted envelope
  recovery into a separate empty local record store with no destructive
  overwrite.
- `assets/js/local-first/w396-release-recovery-proof.js` creates a redacted
  checklist board only. It does not run a backup, change storage, connect to
  Cloudflare, inspect Google, or create a release certificate.

## Gates before Collection, Relay or external connectors

W396 requires a genuine manual browser pass. Until then, do not activate
account-backed Collection, Vault Reveals, EON Relay referral grants, server
social tokens, scheduled posting, cloud media jobs, user deployment, or any
claim that a user can restore work from their Google account.

