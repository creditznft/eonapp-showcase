#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run qa:w100-vault-rebuild
npm run build
npm run audit:site
npm run smoke:build
printf '\nW100 Vault restore and verification completed.\n'
