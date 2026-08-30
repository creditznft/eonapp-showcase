#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
npm ci
npm run qa:w101-marketplace
npm run qa:w101-nft-diversity
npm run build
npm run audit:site
npm run smoke:build
