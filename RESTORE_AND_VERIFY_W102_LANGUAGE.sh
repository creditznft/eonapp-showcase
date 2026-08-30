#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run qa:w102-language-truth
npm run test:unit
npm run build
npm run audit:site
npm run smoke:build
npm run qa:w100-vault-rebuild
npm run qa:w101-marketplace
cat <<'NOTE'
Core W102 verification passed.
For deterministic browser proof, run in one terminal:
  node scripts/lhci-static-server.mjs --port 4183 --root dist
Then run in another terminal:
  npm run qa:w102-language:browser:suite
NOTE
