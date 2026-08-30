# W479.5 + W479-M0 — Codex-ready closure and local creator media setup guidance

## What changed

- Added a final non-payment certification board that keeps production certification, physical-device proof, Dodo checkout, direct social OAuth, local image/video adapters, and automatic posting explicitly blocked until Codex/live evidence and owner GO.
- Added the `verify:w4795-codex-ready-source` chain for the final source-side handoff run.
- Added W479-M0 local creator media setup guidance for device-aware image/video onboarding:
  - mobile remains guide-only;
  - RTX/GPU devices get conservative ComfyUI-style image setup guidance;
  - workstation/full video is marked advanced but still inactive until adapter proof;
  - no browser install, model download, silent LAN discovery, generation, raw upload, or autopost claim.

## New files

- `config/w4795-final-nonpayment-certification-contract.mjs`
- `scripts/w4795-final-nonpayment-certification-gate.mjs`
- `tests/unit/w4795-final-nonpayment-certification.test.mjs`
- `config/w479m0-local-creator-media-setup-contract.mjs`
- `assets/js/local-ai/local-creator-media-setup.js`
- `scripts/w479m0-local-creator-media-setup-gate.mjs`
- `tests/unit/w479m0-local-creator-media-setup.test.mjs`

## Modified files

- `package.json`

## Verification targets

- `npm run qa:w4795-final-nonpayment-certification`
- `npm run qa:w479m0-local-creator-media-setup`
- `npm run verify:w4795-codex-ready-source`

## Honest limitations

This patch does not deploy, does not certify live production, does not activate payments, does not connect direct social OAuth, does not connect a local media runtime, and does not perform physical Android/iPhone/tablet proof. Codex must rebase onto current `main`, run the full validation chain, deploy, collect evidence, and request owner GO/NO-GO.

## W481 add-on

Added a manual-first Ready-to-Post bridge pass that upgrades Share Packs with platform variants, alt text, first-comment/pinned-comment drafts, format notes, and a safe asset-handoff boundary while keeping direct publishing, OAuth, server media relay, scheduling, tracking, and posting receipts inactive.

New W481 files:
- `config/w481-manual-ready-to-post-bridge-contract.mjs`
- `scripts/w481-manual-ready-to-post-bridge-gate.mjs`
- `tests/unit/w481-manual-ready-to-post-bridge.test.mjs`

Modified W481 runtime:
- `assets/js/share/eon-share-pack.js`
- `package.json`

New W481 command:
- `npm run qa:w481-manual-ready-to-post-bridge`

## W482 add-on

Added final product-polish/Codex-handoff gate and generated handoff prompt. This keeps the remaining work in Codex’s lane: current-main rebase, validation, deploy, live browser evidence, physical device evidence, evidence ZIP, and owner GO/NO-GO.

New W482 files:
- `config/w482-product-polish-codex-handoff-contract.mjs`
- `scripts/w482-product-polish-codex-handoff-gate.mjs`
- `tests/unit/w482-product-polish-codex-handoff.test.mjs`

New W482 command:
- `npm run qa:w482-product-polish-codex-handoff`
