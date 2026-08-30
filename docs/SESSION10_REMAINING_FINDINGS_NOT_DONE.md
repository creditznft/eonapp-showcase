# EONAPP Session 10 — Remaining Findings Not Done Yet

This file is intentionally strict. It prevents us from accidentally saying “100% done” when live external proof still has to be captured.

## Still required before paid ads

### 1. Telegram Mini App real session proof

Required proof:
- Open `@EonAppsBot` in Telegram.
- Open the Mini App from BotFather-configured `/telegram` entry.
- Confirm Telegram WebApp object is detected.
- Confirm channel membership check for `@EonApps`.
- Confirm Telegram server-side status panel is visible.
- Capture screenshot and JSON/status artifact.

### 2. Monetag valued postback proof

Required proof:
- User tap starts rewarded action.
- Frontend callback records only local/pending UX.
- Monetag valued postback reaches Cloudflare.
- Cloudflare signs reward status and stores safe proof receipt.
- UI changes from pending to server-verified.
- No account-wide entitlement is granted from frontend callback alone.

### 3. NOWPayments low-value payment proof

Required proof:
- Create low-value test/real invoice.
- Confirm pending status.
- Confirm IPN signature verification.
- Confirm final `finished`/verified status.
- Confirm local receipt is not enough without server proof.
- Confirm no raw provider payload, IP, user-agent, Telegram ID, or token is exposed in proof UI.

### 4. Optional direct-wallet/EVM proof

Required only if direct wallet fallback remains enabled:
- Funded low-value transaction.
- Chain receipt captured.
- Confirmation threshold met.
- Entitlement status is marked reviewed/verified, not automatic from arbitrary frontend entry.

### 5. Production browser/device proof

Required proof:
- Desktop Chromium.
- Mobile portrait.
- Mobile landscape.
- Routes: Home, Chat, EON Browser, Code Maker, Creator Studio, Market, Vault, Vault Backup, Vault Payments, RealmWorld, Reward Access, Telegram, Subscription, Support.
- No unclosable overlays.
- No mobile CTA obstruction.
- EON City Hide UI / Close panels / Reset camera works.
- EONBOT status strip visible and not blocking input.
- Market starter cards visible on first load.

### 6. Vault real export/import restore drill

Required proof:
- Create backup.
- Save backup file.
- Clear simulated local state.
- Restore from backup.
- Confirm NFTs/receipts/rewards/API-key status/settings survive.
- Confirm receipt hash and restore event log.

## Non-blocking cleanup

- EONBOT starter prompts should mention local AI model discovery.
- Node module-type warning should be reviewed once in Codex/CI.
- Keep all public visible `W###` implementation-wave language out of production pages.
## Exact paid-ads blockers for final gate

- Real Telegram Mini App session inside @EonAppsBot
- Real Monetag valued postback in Cloudflare KV/status endpoint
- Low-value NOWPayments finished payment proof
- Funded low-value EVM receipt proof if direct wallet fallback is enabled
- Post-deploy browser/device proof
- Browser export/import Vault restore drill

