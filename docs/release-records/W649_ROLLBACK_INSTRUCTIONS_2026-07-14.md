# W649 Local Rollback Instructions

## Authority points

- Pristine W648D local baseline commit: `e8d5a4cdf212d6085eae6f921d3d7dc0c78f7fc1`
- W649 runtime integration commit: `e9611bebfaab525a6ad4a3b773949ff038461032`
- W649 production-emission fix commit: `d06794115723c307577a50d3bcb9e979c3b58e35`
- Authoritative W648D source archive SHA-256: `5720d1bd7054003a3e85a120b7a1fcfb9188e2b1855b99f6e181a25a017ef276`

## Git rollback in a repository that contains these commits

Create a rollback branch; do not rewrite `main` and do not force-push:

```bash
git switch -c rollback/w648d-before-w649
git reset --hard e8d5a4cdf212d6085eae6f921d3d7dc0c78f7fc1
npm ci
npm run test:unit
npm run build
npm run smoke:build
```

## Archive rollback without Git history

Extract the authoritative W648D full-source-and-evidence ZIP from the original W649 handover, verify its SHA-256 against the value above, run its clean extraction helper, install dependencies and execute the maintained gates. Never merge generated `public/`, `dist/`, reports, browser storage state, `.env` files or secrets into the restored source.

## Cloudflare rollback

Use Cloudflare deployment history to restore the last certified production deployment. Do not build a new rollback artifact from an unverified working tree. After rollback, verify release identity, authentication, critical routes, persistence, billing truth and City guest behavior.
