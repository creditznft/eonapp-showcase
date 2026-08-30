# EONAPP ChatGPT-Ready Source Handoff

Commit:
`1c3f661e7f744c3e7f8d31baa514c4ed0b549072`

Purpose:
This bundle contains the exact tracked repository source from the deployed commit above, prepared for upload into another ChatGPT window for source inspection, Vite build work, and test execution.

Included:
- App source files
- Test files
- Vite build inputs
- `package.json`
- `package-lock.json`
- GitHub workflow files
- Smart contract workspace files tracked in the repo

Not included:
- `.git`
- local caches
- local temp folders
- `node_modules`
- unrelated local scratch/output files

Recommended commands:

```bash
npm ci --include=dev --no-audit --no-fund
npm run lint -- --max-warnings=50
npm run test:unit
npm run build
npm run audit:site
```

W149 / deploy-prep commands:

```bash
npm run qa:codex-deploy-prep
npm run qa:w149-ceo-launch-verification:server
npm run launch:readiness
```

Smart contract tests:

```bash
cd "Smart Contracts"
npm ci --include=dev --no-audit --no-fund
npx --no-install hardhat test
```

Notes:
- CI unit-test failure was fixed by updating the W142 creator safety gate to match current public-safe Creator Studio copy and by forcing the W142 test to regenerate its stats file fresh on each run.
- The bundle is intended for analysis/build/test in ChatGPT, not as a full machine image.
