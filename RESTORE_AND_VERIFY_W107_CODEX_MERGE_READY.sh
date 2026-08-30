#!/usr/bin/env bash
set -euo pipefail
npm ci
NODE_OPTIONS="--max-old-space-size=4096" npm run build
npm run smoke:build
npm run audit:site
npm run qa:w105-performance
npm run qa:w106-live-integrations
./node_modules/.bin/tsc -p tsconfig.strict.json --pretty false
./node_modules/.bin/tsc -p tsconfig.checkjs.json --pretty false
./node_modules/.bin/eslint assets/js sw.js --max-warnings=0
node --test tests/unit/*.test.js tests/unit/*.test.mjs
