#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run build
npm run qa:w98-session11-performance
printf '\nSession 11 source, build and dedicated performance gates passed.\n'
