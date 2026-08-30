#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run build
npm run qa:w98-session13-mega
printf '\nSession 13 source, production build and mega-enhancement gates passed.\n'
printf 'Continue with the independent Session 14 plan in CodexAuditPack/W98_SESSION13/.\n'
