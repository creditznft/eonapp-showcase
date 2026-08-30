#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run build
npm run qa:w98-session12-polish
printf '\nSession 12 source, build and presentation gates passed.\n'
