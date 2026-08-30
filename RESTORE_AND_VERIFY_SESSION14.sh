#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run build
npm test
npm run audit:site
npm run smoke:build
printf '
Session 14 baseline restored and core verification completed.
'
