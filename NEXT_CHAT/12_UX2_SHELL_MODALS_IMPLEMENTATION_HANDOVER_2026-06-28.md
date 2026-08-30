# UX-2 Compact Account, Settings and Apps — Implementation Handover

**Date:** 2026-06-28  
**Baseline:** W405 continuation bundle only, then the validated UX-1 checkpoint  
**Status:** source implementation and source/build validation complete; production/manual evidence remains required.

## What changed

UX-2 moves routine account and workspace controls into compact app-shell overlays instead of routing a user through a large settings/profile experience.

### Profile modal

- The signed-in header account entry opens an in-shell **Profile** modal.
- Users can update a browser-local display name and remix the existing local avatar presentation.
- A signed-in user can explicitly sign out from the modal; this preserves locally retained work and returns the shell to Guest mode.
- The account-deletion destination remains separate and deliberate; it is not an automatic destructive action.
- A Guest sees a clear Continue with Google entry rather than a visible anonymous/random account identity.

### Settings modal

The compact Settings surface has the agreed tabs:

1. General
2. Appearance
3. Voice & language
4. Local AI
5. Data & Sync
6. Connected Apps
7. Privacy & security
8. Billing

The modal is deliberately truthful about inactive scope:

- **EON Sync — Coming soon.** Google Login is identity only; it does not upload local Chat, Vault, projects, files, API keys or browser caches.
- Connected social/publishing accounts are not active.
- Billing is not active: there is no checkout, subscription, payout, referral reward or marketplace purchase flow.

### Apps gallery

The sidebar Apps action opens a small local app gallery with deliberate links to existing EONAPP destinations such as Forge, Workspace, Automations, Local AI, EON City and Vault. It explicitly does not connect accounts, post, deploy or purchase on a user’s behalf.

## Accessibility and device behavior

- The shared shell modal has dialog semantics, Escape close, backdrop close, focus trapping and focus return.
- Profile, Settings and Apps share the same overlay rather than creating competing popup systems.
- The layout includes a narrow-screen breakpoint and supports modal scrolling inside safe mobile dimensions.

## Locked boundaries preserved

This wave does **not** activate:

- EON Sync, storage migration, server endpoints, conflict resolution or Vault/API-key sync;
- connected-app OAuth, social scheduling or posting;
- billing, checkout, subscriptions, rewards, referrals, marketplace purchases or payouts;
- user project deployment or Action Gateway execution.

## What remains unproven

This source package does not prove live OAuth/session behavior, a production account deletion flow, device visual QA, EON Sync, connected-app authorization or any billing capability. A previous local Chromium attempt was blocked by the execution environment before rendering, so no local browser success is claimed.
