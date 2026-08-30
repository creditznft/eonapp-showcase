# W624D — Player Avatar, Camera and Test-Contract Alignment Changed Files

Date: 2026-07-11  
Status: source-complete; one-command Codex predeploy passed 18/18; browser/device proof pending

## Summary

- Added the W624D Wayfinder/camera policy, runtime wiring, visible controls, source gate and focused tests.
- Added deterministic Codex predeploy orchestration with overlap locking and serial maintained tests.
- Classified 47 exact superseded assertions across 36 current test files without deleting their historical originals.
- Preserved the 36 original files in a checksummed, explicitly non-certifying archive.
- Added current-contract alignment, archive-integrity gates, machine manifests, receipts and Codex instructions.
- Updated the canonical roadmap/ledger and prepared W624E continuation.

## File counts

- New files: **83**
- Modified files: **52**
- Deleted files: **0**
- Archived original test copies: **36**
- Current test files with explicit historical skips: **37**

## Principal new files

- `00_START_HERE_NEXT_CHAT_W624E_2026-07-11.md`
- `01_PASTE_READY_NEXT_CHAT_PROMPT_W624E_2026-07-11.md`
- `CHANGED_FILES_W624D_PLAYER_AVATAR_CAMERA_2026-07-11.md`
- `EONAPP_W624D_BROWSER_DEVICE_PROOF_COMMANDS_2026-07-11.md`
- `EONAPP_W624D_CODEX_GITHUB_CLOUDFLARE_PREDEPLOY_2026-07-11.md`
- `EONAPP_W624D_CURRENT_TEST_CONTRACT_ALIGNMENT_2026-07-11.md`
- `EONAPP_W624D_VALIDATION_RECEIPT_2026-07-11.json`
- `EONAPP_W624D_WAYFINDER_CAMERA_SCORECARD_2026-07-11.md`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/MANIFEST.json`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/README.md`
- `assets/js/city/eon-city-wayfinder-experience.js`
- `config/w624d-current-contract-alignment-contract.mjs`
- `config/w624d-current-unit-test-manifest.json`
- `config/w624d-wayfinder-camera-contract.mjs`
- `program/EONAPP_W624D_PLAYER_AVATAR_CAMERA_2026-07-11.md`
- `program/EONAPP_W624E_EONBOT_COMPANION_EXECUTION_BRIEF_2026-07-11.md`
- `reports/w624d-codex-predeploy/final-run.log`
- `reports/w624d-codex-predeploy/receipt.json`
- `scripts/run-w624d-codex-predeploy.mjs`
- `scripts/w624d-current-contract-alignment-gate.mjs`
- `scripts/w624d-test-archive-gate.mjs`
- `scripts/w624d-wayfinder-camera-browser-proof-runner.mjs`
- `scripts/w624d-wayfinder-camera-browser-proof.mjs`
- `scripts/w624d-wayfinder-camera-gate.mjs`
- `tests/unit/w624d-current-contract-alignment.test.mjs`
- `tests/unit/w624d-test-archive.test.mjs`
- `tests/unit/w624d-wayfinder-camera.test.mjs`

## Checksummed non-certifying historical archive

The following **36** files are untouched copies of the pre-alignment tests. Their hashes and assertion counts are recorded in `archive/tests/superseded-exact-copy/W624D_2026-07-11/MANIFEST.json`. They do not certify releases.

- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/commercial-retirement.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w180-w181-chat-first-shell.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w199-public-route-retirement.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w212-market-stateless-links.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w213-calm-city-trade.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w216-local-finalization.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w217-route-contract.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w218-chat-first-shell-v2.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w219-eonbot-local-ai-workspace.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w220-market-generation-vertical-slice.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w221-cityworldstate-2d-rpg.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w223-invite-share-center.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w224-cityworldstate-3d-parity.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w225-account-catalog-foundations.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w226-commercial-decision-gate.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w227-release-certification.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w231-eon-city-flagship.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w239-w240-release-foundation.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w243-chat-navigation-theme.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w247-economic-commercial-firewall.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w248-city-mode-contract.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w249-babylon-play-proof-spike.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w405-live-ux-city-rescue.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w450-dodo-approval-readiness.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w450a-dodo-catalogue-envelope.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w452-app-shell-quality.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w452b-production-route-emission-cleanup.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w462-trust-accessibility-source-audit.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w487-institutional-code-closure.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w520-core-modularisation.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w524-portability-handover-gate.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w525b-account-vault-ux.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w528-machine-evidence.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w534-historical-documentation.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w535-release-truth-reaudit.test.mjs`
- `archive/tests/superseded-exact-copy/W624D_2026-07-11/tests/unit/w623-ceo-grand-audit.test.mjs`

## Modified production, runner, programme and report files

- `EONAPP_MASTER_LAUNCH_LEDGER_W623_W640_2026-07-11.json`
- `EONAPP_MASTER_LAUNCH_ROADMAP_W623_W640_2026-07-11.md`
- `assets/js/city/eon-city-play-babylon.js`
- `assets/js/eon-city-play-station.js`
- `package.json`
- `program/EONAPP_MASTER_LAUNCH_EXECUTION_LEDGER_2026-07-11.md`
- `reports/w623d-production-reachability/graph.json`
- `reports/w623f-certification-v2/launch-board.json`
- `reports/w623h-minimal-referral-ledger/launch-board.json`
- `reports/w623i-referral-scale/launch-board.json`
- `reports/w624a-city-art-bible/launch-board.json`
- `reports/w624b-city-runtime/launch-board.json`
- `reports/w624c-command-district/launch-board.json`
- `scripts/run-archived-legacy-diagnostic.mjs`
- `scripts/run-current-unit-suite.mjs`

## Current test files aligned to explicit historical skips

Each file below retains current coverage while marking only the exact superseded assertion with the shared W624D archive comment and `test.skip`. Current replacement tests are enforced by the alignment gate.

- `tests/unit/commercial-retirement.test.mjs`
- `tests/unit/w180-w181-chat-first-shell.test.mjs`
- `tests/unit/w199-public-route-retirement.test.mjs`
- `tests/unit/w212-market-stateless-links.test.mjs`
- `tests/unit/w213-calm-city-trade.test.mjs`
- `tests/unit/w216-local-finalization.test.mjs`
- `tests/unit/w217-route-contract.test.mjs`
- `tests/unit/w218-chat-first-shell-v2.test.mjs`
- `tests/unit/w219-eonbot-local-ai-workspace.test.mjs`
- `tests/unit/w220-market-generation-vertical-slice.test.mjs`
- `tests/unit/w221-cityworldstate-2d-rpg.test.mjs`
- `tests/unit/w223-invite-share-center.test.mjs`
- `tests/unit/w224-cityworldstate-3d-parity.test.mjs`
- `tests/unit/w225-account-catalog-foundations.test.mjs`
- `tests/unit/w226-commercial-decision-gate.test.mjs`
- `tests/unit/w227-release-certification.test.mjs`
- `tests/unit/w231-eon-city-flagship.test.mjs`
- `tests/unit/w239-w240-release-foundation.test.mjs`
- `tests/unit/w243-chat-navigation-theme.test.mjs`
- `tests/unit/w247-economic-commercial-firewall.test.mjs`
- `tests/unit/w248-city-mode-contract.test.mjs`
- `tests/unit/w249-babylon-play-proof-spike.test.mjs`
- `tests/unit/w405-live-ux-city-rescue.test.mjs`
- `tests/unit/w450-dodo-approval-readiness.test.mjs`
- `tests/unit/w450a-dodo-catalogue-envelope.test.mjs`
- `tests/unit/w452-app-shell-quality.test.mjs`
- `tests/unit/w452b-production-route-emission-cleanup.test.mjs`
- `tests/unit/w462-trust-accessibility-source-audit.test.mjs`
- `tests/unit/w487-institutional-code-closure.test.mjs`
- `tests/unit/w517-source-convergence.test.mjs`
- `tests/unit/w520-core-modularisation.test.mjs`
- `tests/unit/w524-portability-handover-gate.test.mjs`
- `tests/unit/w525b-account-vault-ux.test.mjs`
- `tests/unit/w528-machine-evidence.test.mjs`
- `tests/unit/w534-historical-documentation.test.mjs`
- `tests/unit/w535-release-truth-reaudit.test.mjs`
- `tests/unit/w623-ceo-grand-audit.test.mjs`

## Validation result

- Maintained unit suite: **814 total / 767 passed / 47 exact historical skips / 0 failed**
- W624D Wayfinder/camera: **20/20; 6/6 tests**
- Current-contract alignment: **16/16; 6/6 tests**
- Archive integrity: **10/10; 1/1 test**
- Codex predeploy: **18/18 ordered stages passed**
- Production reachability: **350 files / 604 import edges / 0 quarantined**
- Lint and secret scan: **zero errors/warnings; zero secret findings**
- Production build/smoke and W623F post-build certification: **passed**

## Evidence boundary

No source or unit result is treated as authenticated production, physical-device, camera-comfort, sustained-performance or owner-visual proof. Those remain separate W624D/W624C evidence lanes.
