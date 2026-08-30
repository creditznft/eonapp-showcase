This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# Start Here — W100 Vault Rebuild

This folder is the authoritative continuation source after the Session 14 Realm certification and W100 Vault split.

## Current state

- AI Workstation preserved
- EON City/Realm conditional certificate preserved
- Vault split into seven focused modules
- W100 static gate: 250/250
- W100 focused tests: 9/9
- W100 browser proof: 55/55
- Fresh build, 61-page site audit and build smoke passed
- Smart contracts unchanged

## Restore

```bash
npm ci
npm run qa:w100-vault-rebuild
npm run build
npm run audit:site
npm run smoke:build
```

The packaged `dist` is already included. `node_modules` is intentionally excluded.

## Continue

Next phase: Marketplace/NFT/lootbox/rewards polish.

Use this prompt in a new chat:

> Continue from the W100 Vault Rebuild balanced complete package. Preserve the certified AI Workstation, EON City/Realm and seven-module Vault. Start Super Wave 4: Marketplace/NFT/lootbox/rewards polish. Do not modify smart contracts or use GitHub unless I explicitly ask.
