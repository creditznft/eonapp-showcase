# Package validation — W286-B3 City Outcome Relay

## Verification receipt

| Check | Result |
|---|---|
| Lockfile SHA-256 | `76089e64a94ce21e1fea24e07a0c5c8067ce3375ac0c102a12ccd16a5e9f5a5d` |
| Locked dependency install | PASS — 432 packages, no lockfile change |
| Approved unit suite | PASS — 275/275 |
| ESLint | PASS — zero warnings |
| Production build | PASS — 194 generated files; 195 files observed in dist |
| W249–W255 City safeguards | PASS |
| W259 preview evidence contract | PASS |
| W265/W286 district contract | PASS |
| W286-B1/B2/B3 City work layers | PASS |
| W260 release NO-GO board | PASS — NO-GO preserved |
| W263/W264/W281/W285/W287/W288 | PASS |
| W267/W268/W271–W277/W280 | PASS |
| W283/W284/W289/W290 boards | PASS — external evidence remains pending |
| Build smoke / site audit / PWA / launch gates | PASS |
| Workspace secret scan | PASS |
| Production dependency audit | PASS — 0 known vulnerabilities |

## Reproducibility notes

- The project declares `npm@11.12.1`; this sandbox used Node `v22.16.0` with npm `10.9.2` because Corepack could not retrieve npm 11 from the public registry. The lockfile install completed successfully with no lockfile modification.
- Codex must run a fresh locked `npm ci` in its own normal local environment before any review, merge, or evidence work.
- The source archive excludes `node_modules`, `dist`, `.git`, artifacts, coverage, caches, logs, environment files, secrets, and nested archives.

## Not proven by this validation

No real browser Lighthouse/Web Vitals, device/touch/accessibility/performance, observed persistence restore, Cloudflare/D1 inventory, rollout/rollback, operations drill, legal review, or independent security review was conducted. These remain external gates.
