# EONAPP.CH Final GO/NO-GO Dossier

Date: 2026-04-22
Mode: No browser tests executed (static audit + invariants + readiness only)
Decision owner: Launch Ops + Engineering

---

## Executive Decision

Current status: CONDITIONAL GO

Reason: all automated engineering launch gates are green; decentralized IPFS/IPNS publish is now completed on this node, while Arweave + public gateway propagation checks remain track-level ops steps.

Everything audited in this session is launch-ready at static integrity level.

---

## Gate Results Snapshot

### Gate 1: Static integrity

Command:
- npm run launch:check

Result:
- PASS
- Site audit passed: 66 HTML files scanned, tools/games/sitemap/precache verified.

### Gate 2: Page-level SEO/security/trust invariants

Command:
- npm run launch:page-gate

Result:
- PASS on blockers
- 0 blockers
- 2 warnings (content mentions ad-network concepts in trust-surface copy):
  - about.html
  - privacy.html

Interpretation:
- Warnings are policy-content notes, not technical launch blockers.

### Gate 3: Launch readiness

Command:
- npm run launch:readiness

Result:
- PASS
- Blockers: 0
- Warnings: 0

### Gate 4: Lootbox runtime integrity

Command:
- npm run launch:lootbox-gate

Result:
- PASS
- Blockers: 0
- Warnings: 0

### Gate 5: Games challenge/discovery identity integrity

Command:
- npm run launch:games-identity-gate

Result:
- PASS
- Blockers: 0
- Warnings: 0

---

## Unresolved Blockers (Only)

### B-01 (Operational, Cloudflare track only): Deployment secret confirmation

Context:
- `.github/workflows/deploy.yml` is present and configured.
- Automated static gates cannot verify secret presence in GitHub repo settings.

Required:
- Confirm secrets exist in GitHub Actions:
  - CLOUDFLARE_API_TOKEN
  - CLOUDFLARE_ACCOUNT_ID

### B-02 (Operational, decentralized track only): Release publishing verification

Context:
- The repo already includes browser-native P2P and gateway-based decentralized access patterns.
- A decentralized-first release still needs a verified publishing run through immutable and mutable distribution layers.

Current completion:
- IPFS publish: complete (`QmWJtpEU6n8eXQeSYHdEJCVKKVNP1wWq77KaW4ctTdPpkU`)
- IPNS pointer update: complete (offline publish mode)
- Deployment state: `published` in `.ipns-config/deployment-state.json`
- Release record: present under `docs/release-records/`

Remaining track-level ops:
- publish approved build to Arweave
- verify external HTTPS gateway reachability after propagation

---

## Deployment Tracks

### Track A — Cloudflare-assisted release

Use when:
- fast CDN delivery and GitHub push deploys are the main priority

Blocking condition:
- B-01 must be resolved

### Track B — Decentralized release

Use when:
- browser-local runtime and reduced single-point-of-failure risk are the main priority

Blocking condition:
- B-02 must be resolved

### Recommended track now

- Dual release: publish decentralized artifacts first, keep Cloudflare as a mirror and optional accelerator rather than the only runtime path.

---

## Exact Fix Order (Shortest Path to GO)

1. Choose deployment track:
  - Cloudflare-assisted
  - decentralized
  - dual release
2. If Cloudflare-assisted or dual release: confirm Cloudflare deploy secrets in GitHub Actions.
3. If decentralized or dual release: publish approved build to Arweave, publish mirror to IPFS, update IPNS pointer, verify gateway access, and write release record.
4. Re-run gate: npm run launch:readiness
  - Expected target: Blockers = 0
5. Re-run gate: npm run launch:check
   - Expected target: pass unchanged
6. Re-run gate: npm run launch:page-gate
   - Expected target: Blockers = 0
7. Re-run gate: npm run launch:lootbox-gate
  - Expected target: Blockers = 0
8. Tag release candidate and publish via the chosen release track.

If step 2 still fails:
- open docs/AD_NETWORK_SETUP_CHECKLIST.md
- resolve config mismatch and rerun step 2

Operational references:
- `docs/HYBRID_RELEASE_RUNBOOK_2026-04-22.md`
- `docs/IPFS_IPNS_WINDOWS_SETUP_CHECKLIST_2026-04-22.md`

---

## What Was Hardened This Session

- Trust-surface ad safety tightened:
  - Removed about page ad slot
  - Removed vault page ad slot
- Root page metadata consistency improved:
  - tools/games OG alignment
  - privacy/archive schema and metadata completion
  - 404/offline canonical + social + robots metadata added
- Automated second-pass page invariant gate introduced:
  - scripts/launch-page-invariants.mjs
  - npm run launch:page-gate
- Automated lootbox runtime integrity gate introduced:
  - scripts/launch-lootbox-integrity.mjs
  - npm run launch:lootbox-gate

---

## Residual Risk Notes (Non-Blocking)

1. Trust-surface warning language:
- about/privacy pages discuss ad-network behavior in explanatory text.
- This is not execution risk, but messaging can be softened if desired.

2. CSP host list size:
- Large allowlist is functional but should be curated periodically.

3. Deployment architecture choice:
- Cloudflare is no longer the only viable runtime path.
- The repo already supports a decentralized browser-first architecture with URL artifacts, Nostr relay discovery, and IPFS/Arweave gateway access.
- Pure client-side deployment remains honest only while features avoid shared mutable truth requirements.

4. Identity and moderation surface:
- public identity should remain generated-only
- no chat, freeform bios, custom image uploads, or user-posted links should be introduced in this launch model

---

## Final Condition for GO

GO is approved when and only when all are true:

- launch:readiness => 0 blockers
- launch:check => pass
- launch:page-gate => 0 blockers
- launch:games-identity-gate => 0 blockers
- launch:lootbox-gate => 0 blockers
- chosen deployment track operationally verified

As of now, no automated technical blockers remain; only deployment-track operational verification is pending.

---

## Release Handoff Summary

Use this block after each real publish so Ops, Eng, and Growth can read one human summary instead of opening raw artifact files.

Required source artifacts:
- `arweave-manifest.json`
- `.ipns-config/deployment-state.json`
- latest file in `docs/release-records/`

Fill and paste:

- Release label: `rc?`
- Track: `decentralized | cloudflare-assisted | dual`
- Git commit: `paste commit SHA`
- Arweave URL: `paste immutable URL`
- IPFS hash: `paste CID`
- IPNS key / gateway: `paste key name + primary gateway URL`
- Release record: `docs/release-records/<timestamp>-<track>-<label>.md`
- Gate snapshot:
  - `launch:readiness` = PASS/FAIL
  - `launch:check` = PASS/FAIL
  - `launch:page-gate` = PASS/FAIL
  - `launch:games-identity-gate` = PASS/FAIL
  - `launch:lootbox-gate` = PASS/FAIL
- Identity/discovery guardrail check:
  - generated-only identity preserved
  - no chat / links / custom uploads introduced
  - swap artifact feed remains rate-limited

Current session snapshot:

- Release label: `ipfs-cid`
- Track: `decentralized-checklist`
- Git commit: `15dc88af11551340e52bededd75fea77f641d4bd`
- IPFS hash: `QmWJtpEU6n8eXQeSYHdEJCVKKVNP1wWq77KaW4ctTdPpkU`
- IPNS key id: `k2k4r8lu0s69o8w5xalwwnlcnr7pdyfvxeimp81rohru4zc5gxzmiktd`
- Release record: `docs/release-records/20260421T212240Z-decentralized-checklist-ipfs-cid.md`
- Verified locally:
  - staged site payload resolves through local gateway on `127.0.0.1:8080`
- IPNS publish mode:
  - offline publish completed successfully and is now persisted in deployment state
- Remaining external check:
  - public gateway propagation/refresh timing
