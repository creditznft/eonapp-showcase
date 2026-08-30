# R3-F1/F2 local-static package validation

## Included wave

- R3-F1 physical active-source reduction
- R3-F2 route tiering and root simplification
- Previously completed W255 City parity, W256 EONBOT proposal/Vault return and W257 beginner work missions

## Fresh proof results

- 193/193 approved current-product unit tests passed.
- ESLint completed with zero warnings.
- Fresh production build completed.
- R3-F1: 103 retired value-system files hash-verified; 132 active reachable modules; no active raw EVM address or transaction primitive.
- R3-F2: 8 retired root documents hash-verified outside active root; 29 tiered root HTML documents; Tier 0 is Chat → Projects → Workspace → EON City.
- W239/W242/W243/W244/W247/W248/W249–W257 passed.
- W143/W174, smoke, static site, PWA, readiness, identity, page, quality, workspace secret scan and `npm audit --omit=dev` passed.

## Deliberate exclusions

- `node_modules`, `dist`, `.git`, `.env*`, caches, generated runtime artifacts, Hardhat `artifacts/` and `cache/`, runtime temporary folders, credentials and secrets.

## Important limitation

This validates source and built output locally. It does not certify Preview/live browser behavior, physical Android/iPhone/desktop, PWA update/rollback, Git history, production secret review, CSP/network/console, Lighthouse/accessibility, human visual review or release-owner approval.
