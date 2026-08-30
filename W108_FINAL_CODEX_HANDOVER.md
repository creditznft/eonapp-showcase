This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP W108 Final Codex Handover

## Package purpose

This package is the complete W108 handover built from the latest W108E workspace plus the final audit/fix pass from this chat. It includes all patches W108A through W108E and the final small cleanup pass.

## What changed

### W108A — EON City homepage + Market starter NFTs

- Reworked `index.html` as an EON City / EONBOT / AI Cockpit first impression.
- Added local-first personal starter NFT drops for new Market visitors.
- Added searchable starter utility NFTs that can be saved to Vault-compatible local collections.
- Replaced the broken first-load Market empty feeling.

### W108B — Creator Studio + Workbench UX compression + IoT discoverability

- Creator Studio now opens with five simple first actions.
- Advanced Creator tools are collapsed behind a drawer.
- Workbench now opens with six clear launch actions.
- Advanced Workbench surfaces are collapsed by default.
- Device Lab / IoT Control is visible but safety-gated.
- Fixed duplicated Workbench mission-run button ID.

### W108C — Realm / EON City Device Lab

- Device Lab is now a first-class EON City district/station.
- Realm page exposes Device Lab and private workstation paths.
- EON City safety flags block silent hardware control.
- Device actions require explicit confirmation.

### W108D — Marketplace trust/commercial truth polish

- Added Marketplace commercial-truth panel.
- Added seller policy checks and buyer safety labels.
- Clarified preview NFTs vs on-chain ownership.
- Added no-profit/no-investment wording and listing-validation policy.
- Improved empty states so beta commerce does not feel broken.

### W108E — Performance/route certification

- Added W108 route certification manifest and gate.
- Added W108 final route QA evidence.
- Fixed W105 evidence output so W106 final gate passes in a fresh package.
- Reduced homepage first-paint loading by removing non-critical Telegram/social widgets from first paint.

### Final cleanup pass in this chat

- Removed remaining mojibake from blog/media/leaderboard pages in source and `dist` output.
- Reworded old Market no-results translation so it no longer says `No items match your search`.
- Added static UX audit for all built HTML pages.
- Added final Codex handover instructions and change manifest.

## Important boundaries preserved

This handover does **not** change:

- Smart contracts
- Deployed contract addresses
- NOWPayments receiver logic
- Wallet settlement primitives
- Live trading execution
- Cloudflare secrets

## Verification already run in this workspace

```bash
npm ci
npm run qa:w108-final-handover
node --test tests/unit/w108-market-starter-drop.test.mjs tests/unit/w108b-ux-compression.test.mjs tests/unit/w108c-realm-device-lab.test.mjs tests/unit/w108d-marketplace-trust-policy.test.mjs tests/unit/w108e-route-certification.test.mjs
```

Passed:

- ESLint with `--max-warnings=0`
- Production build
- Build smoke check
- Static site audit
- W108 route certification
- W105 all-route performance/static budget gate
- W106 live integrations/contract map gate
- W108 final static UX audit: 65 built HTML files and 10/10 core routes
- W108A–W108E unit tests: 20/20 passed

Known honest boundary:

- `npm ci` reports 40 dependency audit vulnerabilities inherited from the project dependency tree. I did not run `npm audit fix` because dependency upgrades should be a controlled separate patch.
- Local Chromium screenshot capture was blocked by the sandbox policy. See `W108_SCREENSHOT_ATTEMPT_NOTE.md`. Codex should run real screenshots on Cloudflare preview/live.

## Codex merge instructions

Start from the current deployed W107C/W108 baseline repo, then apply this package as the source of truth for W108 final.

Recommended process:

```bash
# 1. Create branch
git checkout -b w108-final-polish-deploy

# 2. Copy this package contents over the repo root
# Preserve file paths exactly.

# 3. Install and verify
npm ci
npm run qa:w108-final-handover
node --test tests/unit/w108-market-starter-drop.test.mjs tests/unit/w108b-ux-compression.test.mjs tests/unit/w108c-realm-device-lab.test.mjs tests/unit/w108d-marketplace-trust-policy.test.mjs tests/unit/w108e-route-certification.test.mjs

# 4. Build
npm run build

# 5. Deploy to Cloudflare Pages preview first
# Then inspect the preview manually before production deploy.
```

## Manual post-deploy browser checklist

Check desktop and mobile:

```text
/
/chat.html
/eon-browser.html
/build
/create
/vault
/market
/marketplace
/realm
/trust
```

Expected result:

```text
Homepage: EON City + EONBOT + AI Cockpit are the main showoff features.
Market: new visitor sees personal starter NFT drop, not broken empty copy.
Market search: terms like chat, vault, iot, device, trade, creator, realm return relevant starter utility NFTs.
Marketplace: commercial truth, seller policy, buyer labels, no-profit/investment boundaries visible.
Creator Studio: first screen is simple; advanced panels are collapsed.
Workbench: first screen is simple; Device Lab/IoT is discoverable under advanced/safe controls.
Realm: EON City + Private Workstation + Device Lab are first-class.
Trust: strong body copy exists for local data, marketplace, wallet/payment, IoT, and limitations.
No visible mojibake like âš¡, Â©, or Â·.
No first-load `No items match your search` on Market.
```

## Reports included

- `reports/W108_FINAL_CHANGE_MANIFEST.md`
- `reports/W108_FINAL_STATIC_UX_AUDIT.md`
- `reports/W108_FINAL_STATIC_UX_AUDIT.json`
- `CodexAuditPack/W108_FINAL_UX/W108_FINAL_STATIC_UX_AUDIT.md`
- `CodexAuditPack/W108_FINAL_UX/W108_FINAL_STATIC_UX_AUDIT.json`
- `CodexAuditPack/W105_PERFORMANCE/W105_ROUTE_BUDGETS.json`
- `CodexAuditPack/W105_PERFORMANCE/W105_FINAL_VERIFICATION.json`
- `CodexAuditPack/W106_LIVE_INTEGRATIONS/` evidence files
- `reports/W108E_ROUTE_CERTIFICATION.json`
- `reports/W108E_ROUTE_CERTIFICATION.md`

## Deployment recommendation

Deploy this to a Cloudflare preview first. If preview looks correct on mobile and desktop, deploy to production `eonapp.ch`.

After production deploy, run live browser checks and confirm the old live symptoms are gone:

```text
old duplicate homepage phrase block
auto-empty Market state
thin Trust page
visible mojibake on blog/media pages
Marketplace unclear commercial claims
Realm hiding Device Lab
Creator/Workbench overloaded first screen
```
