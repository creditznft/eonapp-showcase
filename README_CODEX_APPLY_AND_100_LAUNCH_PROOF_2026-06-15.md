This file is historical-only.
Use `00_START_HERE_W524_MACHINE_VERIFICATION_2026-07-03.md` as the single top-level coding entrypoint.

# EONAPP GPT-5.5 Final Launch + Short Links Handover

Date: 2026-06-15
Purpose: apply the short referral/realm link patch, then run the full Codex live-launch proof with local `.env.local` keys.

## 0) What this package changes

This handover adds production-ready short public links while preserving the existing long signed token as canonical decentralized proof.

New public link shape:

```text
Referral: https://eonapp.ch/r/<22-char-code>
Realm:    https://eonapp.ch/m/<22-char-code>
```

Security model:
- the 22-char code is a 128-bit random base64url alias
- `/api/share-links/register` stores `shortCode -> signed eon1 envelope` in Cloudflare KV
- `/api/share-links/resolve` returns the signed envelope
- the browser still verifies the P-256 signed token before attribution or redirect
- long `https://eonapp.ch/r/#eon1...` links remain as fallback/export proof

## 1) Apply files

From repo root, copy these files over the existing files:

```text
package.json
_redirects
assets/js/utils/signed-share-link.js
assets/js/referral-landing-page.js
functions/api/share-links/_verify.js
functions/api/share-links/register.js
functions/api/share-links/resolve.js
tests/unit/w63-signed-share-link.test.mjs
tests/unit/gpt55-short-share-link-resolver.test.mjs
scripts/gpt55-link-entropy-audit.mjs
scripts/gpt55-cloudflare-prod-readiness.mjs
scripts/gpt55-ai-agent-deep-proof.mjs
scripts/gpt55-static-launch-audit.mjs
scripts/gpt55-launch-proof-runner.mjs
scripts/gpt55-live-http-proof.mjs
scripts/gpt55-telegram-webview-cdp-proof.mjs
```

Do not overwrite `.env.local`.

## 2) Cloudflare settings that must exist before launch

Current confirmed by user:

```text
AD_REWARDS_KV -> eonapp-ch AD_REWARDS_KV
NOWPAYMENTS_SUBS_KV -> NOWPAYMENTS_SUBS_KV_PROD
TELEGRAM_BOT_TOKEN -> encrypted Secret
TELEGRAM_CHANNEL_USERNAME -> EonApps
MONETAG_REWARDED_SCRIPT_URL -> https://libtl.com/sdk.js
MONETAG_REWARDED_SDK_FUNCTION -> show_11111741
MONETAG_REWARDED_ZONE_ID -> 11111741
AD_REWARD_POSTBACK_SECRET -> encrypted Secret
NOWPAYMENTS_IPN_SECRET -> should be encrypted Secret
```

Must add/confirm:

```text
NOWPAYMENTS_API_KEY -> encrypted Secret, required for live create-subscription API calls
EON_SHARE_LINKS_KV -> recommended dedicated KV namespace for short links
```

The short-link worker can fall back to `AD_REWARDS_KV` or `NOWPAYMENTS_SUBS_KV`, but a separate `EON_SHARE_LINKS_KV` is cleaner and safer before public growth campaigns.

## 3) First no-write local gate

```bash
npm ci --include=dev --no-audit --no-fund
npm run build
npm run audit:site
npm run launch:readiness
npm run lint -- --max-warnings=50
npm run gpt55:static-launch-audit
npm run gpt55:short-link-test
npm run gpt55:cloudflare-prod-readiness
npm run qa:w150-telegram-reward-hardening
npm run qa:ad-final-gateway
npm run qa:final-telegram-rewards
npm run qa:w138-market-nft-generation-proof
npm run qa:w145-update-safe-user-data-survival
npm run qa:w165-final-gamer-power-user-certification
```

Expected: all pass except `gpt55:cloudflare-prod-readiness --strict-exit` may fail until local `.env.local` and Cloudflare dashboard both include `NOWPAYMENTS_API_KEY` and all required secrets.

## 4) Deep AI provider and local model proof

Start local preview:

```bash
npm run build
npx vite preview --host 127.0.0.1 --port 4173
```

Second terminal:

```bash
npm run gpt55:ai-deep-proof -- --strict-exit
npm run qa:ai-live-super
npm run qa:ai-live-super:strict
npm run qa:ai-live-super:browser
npm run qa:live-ai-e2e
npm run smoke:providers
```

Local Ollama checks require:

```text
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

Codex should record which providers actually returned usable text, which timed out, and which model/provider keys are invalid.

## 5) Telegram Mini App blank-panel blocker

This remains a launch blocker until the real Telegram webview opens EONAPP content.

Run Chrome with remote debugging:

```powershell
taskkill /IM chrome.exe /F
$profile="$env:USERPROFILE\chrome-eonapp-audit"
Start-Process "chrome.exe" -ArgumentList "--remote-debugging-port=9222 --user-data-dir=`"$profile`" https://web.telegram.org/"
```

Log in to Telegram Web, open `@EonAppsBot`, click the Mini App button, then run:

```bash
npm run gpt55:telegram-cdp-proof -- --cdp=http://127.0.0.1:9222 --duration-ms=90000 --out=reports/gpt55-launch/session-telegram-cdp
```

Evidence required:
- Mini App screenshot not blank
- webview URL
- console logs
- failed network requests
- CSP/X-Frame/iframe header status
- `/api/telegram/session` response with secrets redacted

## 6) Monetag rewarded proof

No unlock may be granted from frontend success alone. Required live evidence:

```bash
npm run qa:w150-telegram-reward-hardening
npm run qa:ad-final-gateway
npm run qa:final-telegram-rewards
```

Then trigger one user-tap rewarded ad from Telegram Mini App and confirm:
- Monetag dashboard shows the reward event
- Cloudflare Function log shows `/api/ad-rewards/postback`
- `/api/ad-rewards/status?ymid=<provider_ymid>` finds provider value proof
- no reward is granted before postback/status proof

## 7) Payments and wallet proof

No-write first:

```bash
EON_LIVE_WRITE_TESTS=0
EON_ALLOW_REAL_PAYMENT_TEST=0
EON_ALLOW_REAL_CHAIN_WRITE=0
node --test tests/unit/nowpayments-ipn.test.mjs tests/unit/subscription.test.mjs tests/unit/wallet-connector.test.js tests/unit/wallet.test.js
```

Then only after all browser/static/Telegram gates pass:

```bash
EON_ALLOW_REAL_PAYMENT_TEST=1
EON_MAX_PAYMENT_TEST_USD=1.00
EON_ALLOW_REAL_CHAIN_WRITE=1
EON_MAX_GAS_TEST_USD=5.00
```

## 8) Final launch confidence rule

Do not call this launch-ready until these are all green:

```text
Build + static launch readiness
Short referral and realm links register/resolve/verify
AI provider live output + Ollama local output
Telegram Mini App real webview not blank
Monetag user-tap rewarded ad + Cloudflare postback/status proof
NOWPayments API create-subscription + signed IPN verification
Direct EVM quote/verify rejects wrong recipient/amount/replay
Market first visit generates starter NFTs and Vault save persists
Vault update-safe storage proof
EON City mobile + desktop visual proof with overlays not blocking controls
Wallet connect and optional tiny transaction proof
Final screenshot/evidence bundle indexed in reports/gpt55-launch
```
