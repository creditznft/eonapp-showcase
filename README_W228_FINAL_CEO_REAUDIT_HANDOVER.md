This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W228 Final CEO Re-Audit Source Handover

## What this is

A cumulative source package for Codex/CI. It contains the W217–W228 source state, Vite configuration, `package.json` and lockfile, current tests, Playwright specs, current source evidence, historical archives, and exact merge/deploy proof instructions.

## What it is not

- not a production approval;
- not a browser/device proof package;
- not a reward, payment, payout, ad, token, affiliate, checkout, or public marketplace activation;
- not a package containing secrets, `.env` files, `node_modules`, browser binaries, or generated build output.

## Start here

- `docs/W228_CEO_GRUMPY_AUDIT.md`
- `docs/W228_PHASE_0_10_STATUS.md`
- `docs/CODEX_W228_MERGE_DEPLOY_BROWSER_PROOF.md`
- `docs/W228_GROWTH_REWARDS_ADS_DECISION.md`
- `docs/W228_PUBLIC_PRODUCT_STATUS_MATRIX.md`

## Local commands

```bash
npm ci
npm run security:secret-scan
npm run qa:w216-release-candidate
npm run build
npx playwright install chromium
npm run qa:browser-proof:current
```

Use `security:secret-scan:ci` only inside a real Git checkout with complete reachable history.

## Product truth

Chat is primary. Workspace is the focused tool surface. City 2D is default. City 3D is optional. Market creates private local previews on explicit action. Realm is private/local. Share Center is signed discovery/invite material plus local campaign drafting. Commercial/reward/token/payment/payout paths are disabled.

## Final W228 certification note

The code and static gates are source-certified. Browser/device/Preview/production proof is deliberately pending because this execution environment blocks Chromium navigation to `localhost` with `ERR_BLOCKED_BY_ADMINISTRATOR`. See `docs/W228_FINAL_CERTIFICATION_RESULT.md` and `evidence/w228/17-browser-proof-limitation.md`.
