# Package validation — W280-B1 Local Support Evidence Pack

## Verification receipt

| Check | Result |
|---|---|
| Lockfile SHA-256 | `76089e64a94ce21e1fea24e07a0c5c8067ce3375ac0c102a12ccd16a5e9f5a5d` |
| Approved unit suite | PASS — 279/279 |
| ESLint | PASS — zero warnings |
| Production build | PASS — 194 generated files; 195 files observed in `dist` |
| W280-A0 support narrative | PASS |
| W280-B1 local evidence pack | PASS — preview-first, manual-review-required, local only |
| W145 update-safe state | PASS |
| W260 release board | PASS — NO-GO preserved |
| W283/W284 Cloudflare/referral boards | PASS — evidence-only / not authorised |
| W286-B1/B2/B3 City work layers | PASS |
| W267/W268/W271–W277 | PASS — external evidence remains pending |
| Build smoke / site audit / PWA / launch gates | PASS |
| Workspace secret scan | PASS |
| Production dependency audit | PASS — 0 known production vulnerabilities |

## Reproducibility

- The archive excludes `node_modules`, `dist`, `.git`, artifacts, caches, coverage, logs, environment files, secrets, and nested archives.
- Codex must run a fresh `npm ci` in its own normal local environment before review or any merge work.
- The environment-level all-in-one core wrapper was limited by the five-minute command ceiling after completing its early stages. Every subsequent source gate was replayed in bounded runs and passed; this is an orchestration limit, not a source pass inferred from a timeout.

## Not proven

No normal-browser Lighthouse/Web Vitals, real-device/touch/accessibility/performance, observed persistence restore, Cloudflare/D1 owner inventory, deployment/rollback, named operations drill, legal review, independent security review, beta result, or public-launch approval was conducted. W260 remains **NO-GO**.

## Archive verification

The delivered W280-B1 archive was created after the final source checks and excludes dependencies, build output, logs, artifacts, environment files, secrets, and nested archives. Its separate integrity report and SHA-256 checksum are the authority for final archive counts and hash verification.
