# NFT Operations Runbook — Amoy / Mainnet Cutover

## Purpose
This runbook defines the operator flow for EON Relics across gallery config, ERC-1155 voucher mode, ERC-721 contract mode, NFT.Storage usage, and release cutover.

## Scope
- Gallery manifest switching
- ERC-721 Amoy smoke validation
- ERC-1155 voucher export handling
- NFT.Storage token handling
- Mainnet cutover checklist
- Rollback path

## Current Live State
- Amoy ERC-1155 profile: EONLiteLoot at `0x174f3764F21a0AB651f8ac592352aa1C343A885D`
- Amoy ERC-721 profile: EONRelicNFT at `0x09c8569090953A665a042640c2Da2fF48cF4D5D6`
- Mainnet ERC-721 profile: not live yet
- Manifest file: `assets/config/deployed-contracts.json`

## Manifest Control
File:
- `assets/config/deployed-contracts.json`

Required fields per profile:
- `label`
- `network`
- `chainIdHex`
- `contracts.primary.name`
- `contracts.primary.address`
- `contracts.primary.tokenStandard`
- `contracts.primary.mintMode`
- `contracts.primary.addressStatus`

Approved profile meanings:
- `amoy-loot`: ERC-1155 voucher mode for EONLiteLoot
- `amoy-relic721`: ERC-721 on-chain mint mode for EONRelicNFT
- `polygon-relic721`: reserved for mainnet cutover

Manifest rules:
- Never set `activeProfile` to a profile with a zero address.
- Mainnet profile must stay `pending-deployment` until deploy + verify + treasury checks are complete.
- Any profile edit requires one smoke validation pass after save.

## NFT.Storage Token Handling
Browser storage key:
- `eon:nftstorage:token`

Policy:
- Token is local-browser scoped only.
- Do not hardcode tokens into source, docs, or manifest.
- Rotate token immediately if exposed in screenshots or shared sessions.
- Before release demos, clear old tokens and configure a fresh token.

Operator setup in browser console:
```javascript
configureNftStorageToken('YOUR_TOKEN')
```

Clear token:
```javascript
configureNftStorageToken('')
```

## ERC-721 Amoy Smoke
Contract smoke script:
- `Smart Contracts/scripts/smoke-relic-amoy.js`

Read-only validation:
```powershell
Set-Location "c:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
.\node_modules\.bin\hardhat run .\scripts\smoke-relic-amoy.js --network amoy
```

Write validation:
```powershell
Set-Location "c:\Users\credi\WORKSPACE\EONAPP.CH\Smart Contracts"
$env:RELIC_SMOKE_WRITE='1'
.\node_modules\.bin\hardhat run .\scripts\smoke-relic-amoy.js --network amoy
```

Expected outcomes:
- `name` = `EON Relics`
- `symbol` = `EONR`
- `mintActive` = `true`
- `maxPerWallet` = `5`
- write run emits `RelicMinted` and returns owner/tokenURI successfully

## Gallery Validation
Gallery file:
- `games/nft-gallery-v2.html`

Required profile-switch checks:
1. `amoy-loot` shows `Mode: ERC1155 • erc1155-voucher`
2. `amoy-relic721` shows `Mode: ERC721 • contract`
3. Mint CTA changes with profile
4. Trophy panel renders claimable entries
5. Per-card export buttons render

Wallet-native E2E required before mainnet:
1. Connect MetaMask in browser
2. Switch to `amoy-relic721`
3. Configure NFT.Storage token
4. Mint one gallery relic
5. Refresh page and confirm persisted UI state
6. Capture tx hash and screenshot

## ERC-1155 Voucher Operations
Local storage key:
- `eon:erc1155-vouchers`

Voucher contents include:
- wallet
- profile
- network
- contract
- source
- mintedAt
- payload.name
- payload.rarity
- payload.attributes
- payload.tokenUri
- payload.imageUri
- payload.trophyType

Export path:
- Use gallery `Export Vouchers` button
- Archive exported JSON with timestamp

Operator rule:
- Treat voucher exports as queued mint instructions, not completed on-chain assets.
- Never mark ERC-1155 voucher items as settled until downstream operator/batch mint flow confirms them.

## Mainnet Cutover Gate
All must be complete:
- Mainnet contract deployed
- Mainnet contract verified
- Mainnet manifest address set
- Treasury and royalty receiver confirmed
- Wallet-native browser E2E logged on testnet
- Acceptance report updated
- Rollback path prepared

Mainnet activation step:
- Update `polygon-relic721` address and `addressStatus`
- Optionally switch `activeProfile` only after signoff

## Rollback
If ERC-721 gallery mint path fails after cutover:
1. Revert `activeProfile` to `amoy-loot` or stable previous profile
2. Preserve failed tx hash and browser console output
3. Do not edit historical voucher exports
4. Re-run smoke script and browser profile-switch checks
5. Publish operator note before retry

## Evidence to Archive Per Release
- Manifest snapshot
- Contract smoke output
- One browser profile-switch screenshot
- One ERC-721 tx hash
- One ERC-1155 voucher export sample
- Acceptance report
