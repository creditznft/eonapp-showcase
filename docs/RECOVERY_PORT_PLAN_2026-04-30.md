# Recovery Port Plan

## Current source of truth

- Source stack: `eonpackage`
- Target stack: EONAPP.CH static wallet runtime
- Current target wallet: `assets/js/utils/wallet.js`
- Current target recovery/export helper: `assets/js/utils/vault.js`

## CEO decision

Port the recovery stack in phases instead of copying the React services directly.

Reason:

- `WalletBackupService_V5.ts` and friends assume a React/TypeScript application shell.
- EONAPP.CH currently runs a browser-first static wallet and vault flow.
- A direct copy would create dead abstractions and increase launch risk.

## Phase 0: existing recovery surface

Already present in EONAPP.CH:

- encrypted vault export/import in `assets/js/utils/vault.js`
- vault UI wiring in `assets/js/vault-page.js`

Already hardened in this session:

- chunked base64 encoding in `assets/js/utils/vault.js` to avoid large export crashes
- minimum passphrase for new encrypted exports raised to 12 characters

## Phase 1: local backup/export/import hardening

Port concepts from:

- `src/services/WalletBackupService_V5.ts`
- `src/services/SecureLocalStorage_V5.ts`

Target deliverables:

- stronger encrypted wallet export file metadata
- hardened encrypted wallet import path
- recovery phrase or recovery bundle flow for the static wallet
- tamper detection and rate limiting for restore attempts

Target surface:

- `assets/js/utils/vault.js`
- `assets/js/utils/wallet.js`
- `assets/js/vault-page.js`

## Phase 2: browser-safe encrypted storage layer

Port concepts from:

- `src/services/SecureLocalStorage_V5.ts`

Target deliverables:

- browser-only encrypted storage helper
- clean key initialization for the local EONAPP wallet
- separation between public profile state and encrypted recovery state

## Phase 3: optional P2P backup hooks

Port concepts from:

- `src/p2p/P2PStorageSystem.ts`
- account backup parts of `WalletBackupService_V5.ts`

Target deliverables:

- optional encrypted backup to user-selected IPFS or P2P destination
- no hard dependency on remote storage for core wallet recovery

## Phase 4: quantum and advanced recovery

Port concepts from:

- `contracts/EONUserQuantumWallet.sol`
- quantum-related frontend flows only after Phases 1-3 exist

Target deliverables:

- quantum commitment UX
- recovery UX that remains optional at launch
- no launch dependency on full quantum wallet migration

## What not to do now

- do not wire treasury auto-swap logic into recovery work
- do not make backup depend on a live backend
- do not copy large React hooks into the static-site runtime unchanged