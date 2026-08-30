# W484 user-facing red-team audit and launch simplification plan

## CEO decision
The app should feel closer to ChatGPT in daily use: simple chat-first shell, collapsed desktop sidebar that expands on hover/focus, clear app lanes, and user-controlled sharing everywhere value is created. After this wave, **2 waves remain before owner GO**: W484 live preview proof and W485 owner activation decision.

## Decisions locked
- Adopt a ChatGPT-style navigation principle: collapsed desktop rail must reveal full labels on hover/focus, while mobile keeps a deliberate drawer.
- Keep EON City as the flagship but make the app feel simpler: Chat first, then Apps, City, Creator, Market, Vault, Local AI, Referral and Support as clear lanes.
- Every shareable object should produce user-controlled copy/link/card first; automatic posting remains locked until each OAuth connector has live proof.
- Referral must feel like an invitation/reward trail, not a crypto/payout promise; attribution and privacy-safe links are mandatory.
- IoT, drones, robotics and smart devices stay future-ready in Device Lab only: client-side pairing guide, visible permissions, emergency stop UX and no launch-active control claims.
- Do not add more launch features until this audit board stays green; improve clarity, proof and conversion before expanding scope.

## Red-team audit domains

### Shell/navigation UX
**Critique:** A powerful app can feel confusing if the sidebar hides labels behind a click. ChatGPT-style hover reveal reduces friction while keeping the clean rail.

**CEO decision:** Desktop collapsed sidebar reveals full labels and chat history on hover/focus; mobile remains a drawer.

**Proof required:**
- assets/js/eon-app-shell.js binds hover/focus expansion
- assets/css/eon-app-shell.css exposes labels during hover-expanded state
- no mobile forced hover behavior
- keyboard focus also expands the rail

### Viral sharing and referral loops
**Critique:** Share systems must be everywhere the user creates value, but never feel spammy or fake-automated.

**CEO decision:** Audit requires share hooks for chat output, Creator exports, EON City postcards, realm/relic profiles, referral invites, rewards, project pages and support success receipts.

**Proof required:**
- share surfaces remain user-controlled
- referral attribution is privacy-safe
- direct social OAuth stays proof-gated
- mobile copy/cards must be readable

### Business logic and monetization clarity
**Critique:** Cash features must make sense before launch: value, ownership, billing state, refund/support, upgrade path and blocked unapproved processors.

**CEO decision:** Billing/Dodo/direct checkout stays off until approval; Market/Vault/Creator value must be explained as non-misleading utility and collectibles.

**Proof required:**
- no checkout activation before approval
- Vault backup/persistence survives updates
- Market does not promise investment returns
- Creator ready-to-post is manual unless connector proof exists

### EON City integration logic
**Critique:** The City should not be a separate gimmick. Each district must route to a real useful task or be clearly preview-only.

**CEO decision:** City launch proof must verify Command Deck lanes: Chat, Creator, Market, Vault, Trade, Local AI, Referral, Device Lab/IoT and Support.

**Proof required:**
- canonical /eoncity only
- no cut controls in portrait/tablet
- Command Deck app lanes open truthful routes
- fallback mode is visible and dignified

### Sync, IoT and external device future
**Critique:** External devices are powerful but high-risk. Non-technical users need plain pairing, permission, test mode and emergency stop before any drone/robot/smart-device action.

**CEO decision:** Device Lab remains a future-ready onboarding lane, not launch-active remote control.

**Proof required:**
- client-side opt-in only
- no background device control
- local-network proof required
- emergency stop and revoke permissions UX required

### Launch simplicity and product meaning
**Critique:** Too many surfaces can dilute the launch. The public story should be: AI cockpit + City workspace + Creator/Market/Vault + safe sharing.

**CEO decision:** Prioritize clarity and receipts over feature expansion; every page needs one obvious next action.

**Proof required:**
- primary CTA per major route
- plain-language empty states
- no fake active labels
- support/help route always available

## Shareable objects to make launch feel viral but controlled
- chat-answer-card
- creator-ready-to-post-pack
- eoncity-postcard
- realm-profile-link
- relic-or-collection-card
- project-showcase-card
- referral-invite-link
- reward-progress-receipt
- vault-backup-reminder-card
- support-resolution-receipt

## Codex live-proof duties
- rebase-w484-onto-current-main-without-overwrite
- prove-sidebar-hover-expand-on-desktop-and-keyboard-focus
- prove-mobile-sidebar-remains-click-drawer-not-hover-dependent
- capture-share-entry-points-across-chat-creator-city-market-vault-referral
- capture-referral-link-generation-and-privacy-safe-attribution
- capture-eoncity-command-deck-route-meaning
- capture-device-lab-iot-copy-as-future-ready-not-active-control
- return-red-team-findings-with-pass-fixrequired-blocked-status

## Activation rule
Direct social posting, checkout activation and IoT/drones/robots/smart-device control remain OFF until live adapter proof, safety UX and owner approval are returned.
