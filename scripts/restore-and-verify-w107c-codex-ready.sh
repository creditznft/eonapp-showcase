#!/usr/bin/env bash
set -euo pipefail

echo "[W107C] verifying no TS nocheck remains"
if grep -RIn "@ts[-]nocheck\|ts[-]nocheck" assets scripts tests types sw.js package.json tsconfig*.json 2>/dev/null; then
  echo "[W107C] TS nocheck marker found; do not deploy" >&2
  exit 1
fi

echo "[W107C] TypeScript strict"
./node_modules/.bin/tsc -p tsconfig.strict.json --pretty false

echo "[W107C] TypeScript checkJS project"
./node_modules/.bin/tsc -p tsconfig.checkjs.json --pretty false

echo "[W107C] ESLint zero warnings"
npm run lint -- --max-warnings=0

echo "[W107C] build smoke"
npm run smoke:build

echo "[W107C] site audit"
npm run audit:site

echo "[W107C] W105 all-route performance gate"
npm run qa:w105-performance

echo "[W107C] W106 live integrations / contract map"
npm run qa:w106-live-integrations

echo "[W107C] unit batches"
if [ -f CodexAuditPack/w107c-final-clean/run_unit_batches.sh ]; then
  bash CodexAuditPack/w107c-final-clean/run_unit_batches.sh
else
  npm run test:unit
fi

echo "[W107C] verification complete"
