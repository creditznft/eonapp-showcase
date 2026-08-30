# W618B — Global Share Command Center + Compact Shell

Date: 2026-07-10
Baseline: W618A EON City Command World

## CEO decision carried forward

EONAPP keeps the approved EON City 10/10 target:

1. **EON Command Room** — the practical 3D productivity cockpit.
2. **Living City Dashboard** — real local/server state as visual city signals.
3. **Agent Theater** — truthful agent/work activity inside the City once there is real job state.

W618B does not build the Command Room yet. It prepares the whole app shell so W618C can use more screen space and every page has a clear Share path.

## What changed

### Compact shell/sidebar

Changed `assets/js/shell/eon-shell-navigation.js`:

- Preserved `EONAPP_PRODUCT_HIERARCHY` for older contracts and regressions.
- Added `EONAPP_COMPACT_PRIMARY_NAVIGATION` for the new launch rail:
  - EONBOT
  - Projects
  - Studio
  - Apps
  - EON City
- Added `EONAPP_COMPACT_MORE_TOOLS` for utility search.
- Mapped secondary routes such as `/local-ai`, `/vault`, `/automations`, `/eon-keys`, `/forge`, `/library` to the compact `Apps` rail state.
- Mapped `/market` and `/studio` to the compact `Studio` rail state.
- Made action-style nav buttons support `aria-current="page"`.

Changed `assets/js/eon-app-shell.js`:

- Added `installGlobalShareCommandCenter()`.
- Added a top-right global Share / Profile / Apps cluster for pages that do not already own a native share control.
- Avoids duplicate share controls on Chat and EON City:
  - Chat keeps its existing top-right header Share.
  - EON City keeps its City HUD Share.
- Added `renderGlobalIdentityAction()` to keep the global profile action in sync with guest/signed-in state.
- Added `data-eon-shell-page` to the sidebar for page-specific compact display rules.
- Reworked Apps modal as the home for secondary tools:
  - Forge
  - Studio / Collection
  - Library
  - Local AI
  - Automations
  - Vault
  - EON Keys
  - Billing
  - Backup Capsule
  - Trade
- Kept legacy W616B strings such as “Automations / EON Flow” and “Studio / Collection” for regression compatibility.

Changed `assets/css/eon-app-shell.css`:

- Reduced default rail width to `14.35rem` and collapsed width to `4.25rem`.
- Hides chat history on non-chat pages to make EON City and work pages cleaner.
- Added top-right global action styling.
- Added EON Share rewards panel styling.

### Share Command Center

Changed `assets/js/utils/eon-share-sheet.js`:

- Imports the EON Keys catalogue/referral matrix.
- Adds an honest rewards panel inside the Share Center.
- Explains that future eligible referrals can earn EON Keys after Dodo/server ledger proof.
- States raw clicks do not grant rewards.
- States EON Keys are non-cash app unlocks only.
- Keeps AI cost boundary: EON Keys unlock EONAPP capability, not platform-paid AI/image/video credits.

### QA

Added:

- `scripts/w618b-share-command-center-shell-gate.mjs`
- `tests/unit/w618b-share-command-center-shell.test.mjs`
- `npm run qa:w618b-share-command-center-shell`

## Explicitly not activated

W618B does **not** activate:

- Dodo checkout
- Live trial start
- Live referral attribution
- Live EON Key grant
- Server ledger
- Browser-only entitlement unlock
- Social posting
- Click tracking
- Cash/wallet/crypto/NFT/payout/commission rewards
- Platform-paid AI/image/video credits

## Next coding wave

W618C should build the **EON Command Room default**:

- `/eoncity` opens to a usable 3D Command Room layer first.
- Existing City assets/districts remain available as Explore mode.
- Big clickable panels for EONBOT, Projects, Forge, Studio, Local AI, Automations, Vault, Share.
- Keyboard shortcuts for the same actions.
- One clean cockpit HUD, no overlapping grey button rows.
- The target is the practical foundation for the later 10/10 Command World.
