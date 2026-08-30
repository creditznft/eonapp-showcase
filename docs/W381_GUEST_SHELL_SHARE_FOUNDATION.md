# W381 — Guest Shell, Profile Utilities & Share Foundation

Date: 2026-06-27

## Purpose

This wave extends the W380 root-chat reset with three small, user-facing improvements before EON Forge:

1. Guest users can find account, help, install, privacy and future-pricing information without an account.
2. Local chats can be pinned in the compact sidebar.
3. The Chat header Share action uses a small, non-modal popover instead of a page-blocking Share Center overlay.

The wave deliberately does **not** activate social account connections, automatic posting, scheduling, click tracking, referral payouts, payment, token, NFT, on-chain ownership, or utility-unlock claims.

## Implemented

### Guest and account utilities

- The lower sidebar now shows **Plans & future pricing**, **Install EONAPP**, and **Help & support** while the browser is in guest mode.
- The profile button now opens a compact menu with guest or signed-in options.
- Guest mode routes to the existing Account & backup screen before a Google OAuth attempt, preserving the local-data acknowledgement requirement.
- Signed-in state is read from the existing same-origin `/api/auth/session` endpoint. The public shell never receives email, Google subject, account ID or OAuth token data.
- Signed-in users can sign out from the compact profile menu. Sign-out does not touch local browser work.
- The root route is allowlisted as a safe identity return destination.
- “Install EONAPP” links to the existing PWA install surface. It does not claim native desktop/mobile binaries that do not exist.

### Pinned chats

- Chats remain session-only by default.
- A user may pin up to eight local chats.
- Pinning changes only the session-local chat metadata; it does not upload, share or back up chat content.
- The sidebar renders **Pinned** and **Recent** groups.

### Compact Share popover

- The Chat header **Share** button now opens a compact non-modal popover on desktop and a compact narrow-screen sheet on mobile.
- It creates an existing self-contained signed EONAPP invite link pointing to the root chat home.
- Users can explicitly copy the link or invoke native browser sharing.
- **Create a share brief** moves a factual campaign request into EONBOT. It asks for copy, variants, visual brief and manual posting plan. It explicitly forbids income, reward, investment, giveaway, connected-account and auto-posting claims.
- The popover states that social publishing and scheduling are not connected yet.
- Current share links do not track clicks, delivery, joins, referral conversion, payout, commission, or reward eligibility.
- The larger legacy Share Center no longer routes campaign briefs to Workspace/AI Cockpit. It now sends the brief to EONBOT.

## Invite milestone policy — design only, not active

Before any invite milestone is launched, use this conservative model:

- One direct inviter relationship only; no downline, tiers, chain earning or percentage of another user’s activity.
- No payment, deposit, purchase, membership fee, transfer, token, cash, withdrawal, resale or exchange value.
- No reward for a click, a copied link, a claimed share, or a social impression.
- A fixed non-transferable cosmetic or enhancement may be considered only after a newly verified user independently completes a meaningful product action.
- The invitee receives the same basic product access regardless of invitation.
- Eligibility must be rate-limited, abuse-reviewed, reversible on fraud, and explained in public terms before activation.
- Any promotional post made in exchange for a benefit must use an appropriate disclosure label where required by the destination platform or applicable advertising rules.
- Obtain India-specific legal review before activation; this code release is not legal confirmation.

## Future EON Share work — blocked until real connections exist

The proposed future product is **EON Share**, not an automatic viral engine:

1. User asks EONBOT for a campaign.
2. EONBOT drafts captions, images/video briefs and a posting calendar.
3. User selects content and reviews every final variation.
4. User connects a platform through that platform’s OAuth flow and grants narrowly-scoped permissions.
5. The user chooses manual publish or a dated schedule.
6. The user can revoke the connection, delete scheduled work and export campaign records.

No platform password, browser token or hidden posting is permitted. No connected publishing or scheduling is coded in W381.

## Validation

Passed:

```text
npm run lint -- --max-warnings=0
npm run build
npm run smoke:build
node --test tests/unit/w217-route-contract.test.mjs tests/unit/w180-w181-chat-first-shell.test.mjs tests/unit/w374b-google-identity-onboarding-surfaces.test.mjs tests/unit/w381-shell-utility-and-share.test.mjs
```

`node scripts/secret-scan.mjs --mode=ci` was started but cannot pass from this extracted handover folder because it has no `.git` directory or reachable history. The W379 source-of-truth handover recorded a clean fresh-clone CI scan; Codex must rerun this scan from a fresh GitHub clone after merging.

## Changed files

```text
assets/css/eon-app-shell.css
assets/js/account/eon-identity-onboarding.js
assets/js/eon-app-shell.js
assets/js/eonbot-home.js
assets/js/utils/chat-threads.js
assets/js/utils/eon-share-sheet.js
tests/unit/w381-shell-utility-and-share.test.mjs
docs/W381_GUEST_SHELL_SHARE_FOUNDATION.md
```

## Next coding order

1. W382 — real chat attachment model: drag-and-drop, local Library records, file type truth and composer attachment chips.
2. W384 — simplify Apps routes and retire Workspace vocabulary through compatibility redirects.
3. W385 — EON Forge Quick Build: one-prompt project, preview, local persistence and free source export.
4. W388 — social account connections only after product, privacy, platform-app and legal gates are separately approved.
