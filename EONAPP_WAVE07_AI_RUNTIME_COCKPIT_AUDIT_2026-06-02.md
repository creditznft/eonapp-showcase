# EONAPP Wave 07 — AI Runtime + Cockpit + BYOK Deep Audit

**Date:** 2026-06-02  
**Workspace base:** Wave 06 full backup, then patched for Wave 07  
**Backup strategy:** lean code backup, excluding `docs/qa/` historical evidence/proof folder only. The lean backup keeps app code, tests, scripts, current docs, `AUDIT/`, `CodexDocs/`, smart-contract sources, Pages Functions, HTML routes, assets, and wave docs.

---

## CEO decision

**EONAPP should keep the BYOK/local-first AI model.** It is a strong differentiator because users can bring free/cheap provider keys or local runtimes instead of EONAPP paying for every AI token.

However, the app must be honest and strict about API-key handling:

- Runtime API keys should be **session-first**.
- Persistent plaintext API-key storage should be **disabled**.
- Optional trusted-device restore should go through the encrypted `ApiKeyVault` path.
- EONBOT/guide copy must not claim more privacy or automation than the code can actually guarantee.
- AI Wallet and agent modes must remain **approval-first**, never auto-executing crypto or financial actions.

**Wave 07 result:** AI runtime/cockpit readiness improved, but live provider tests still need to happen after deploy.

**AI runtime/cockpit score after Wave 07:** **8.1 / 10**

---

## Surfaces inspected

- `chat.html`
- `workbench.html`
- `get-free-ai-power.html`
- `vault.html` AI-key panel copy
- `assets/js/chat/ai-runtime.js`
- `assets/js/chat-page.js`
- `assets/js/chat/responses.js`
- `assets/js/workbench-ai.js`
- `assets/js/utils/api-key-vault.js`
- `assets/js/utils/ai-model-discovery.js`
- `assets/js/utils/ai-readiness.js`
- `assets/js/utils/eon-mode-system.js`
- `assets/js/utils/mission-engine.js`
- `assets/js/utils/local-runtime-policy.js`
- `tests/unit/ai-runtime.test.js`

---

## Main findings

### 1. The BYOK architecture is good

EONAPP does not need to become a costly hosted-AI backend at launch. The app can ship with:

- Guide Mode for no-key product help.
- BYOK cloud AI for users who add their own provider keys.
- Local runtimes such as Ollama / LM Studio / Jan for advanced users.
- WorkBench modes as the main paid/productivity layer.

This is aligned with the user base: builders, creators, coders, crypto users, and side-hustle users who want cheap/free AI power.

### 2. The previous AI-key story was too loose

Older code and guide copy still referred to API keys living in `localStorage` or implied persistent device storage too casually. That is risky because XSS or malicious browser extensions can read browser storage.

### 3. WorkBench had a legacy plaintext-key migration risk

`workbench-ai.js` was reading `eon:workbench:provider-keys:v1` and calling `setApiKey(provider, key, true)`. That meant old plaintext keys could be copied into persistent localStorage again.

This was fixed in Wave 07.

### 4. Model discovery should not scan generic plaintext API-key aliases

`ai-model-discovery.js` previously searched localStorage names such as `EON_OPENAI_API_KEY`, `eon_groq_api_key`, and similar. That encouraged unmanaged plaintext key storage.

This was fixed to use only the active runtime session-key store for cloud-provider discovery.

### 5. AI Wallet language needed to be safer

Guide responses previously described scoped budgets and financial micro-decisions too aggressively. The safer product truth is:

- AI can draft and recommend.
- AI can prepare checklists and handoffs.
- AI cannot execute wallet transfers.
- Any financial/crypto action requires explicit human wallet approval.

---

## Code changes made

### `assets/js/chat/ai-runtime.js`

- `getApiKey()` now prioritizes session keys over any legacy local device key.
- `setApiKey(..., persist=true)` no longer writes plaintext keys to localStorage.
- The `persist` flag is kept for backward compatibility but only logs a warning.
- Added:
  - `listPlaintextDeviceApiKeyProviders()`
  - `clearPlaintextDeviceApiKeys()`
- `loadAISettings()` now forces `persistApiKey: false` to prevent old saved settings from re-enabling plaintext persistence.

### `assets/js/workbench-ai.js`

- Added `ApiKeyVault` migration support.
- Replaced broad legacy key import with a known-provider legacy-key map.
- Migrates known old plaintext keys to session runtime + encrypted vault.
- Scrubs the old `eon:workbench:provider-keys:v1` entries after migration.
- No longer calls `setApiKey(..., true)`.

### `assets/js/utils/api-key-vault.js`

- Replaced predictable fallback passphrase derivation with a random device secret when no identity key exists.
- Updated comments to avoid overclaiming recoverability or perfect protection.

### `assets/js/utils/ai-model-discovery.js`

- Removed generic plaintext localStorage API-key discovery.
- Model discovery now reads from `eon:ai-chat-session-keys:v1` only.
- Local providers still get probed without keys when policy allows.

### `assets/js/chat-page.js`

- Disabled the old “store API key on this device” runtime checkbox.
- Clarified that chat runtime keys are session-only.
- Updated save toast to explain that encrypted restore belongs to Vault setup.

### `get-free-ai-power.html`

- Updated key-storage copy from “localStorage” to session-first + optional encrypted trusted-device restore.

### `assets/js/chat/responses.js`

- Updated stale EONBOT guide copy:
  - removed “keys stored in localStorage” claims
  - clarified local-first limits
  - clarified payment/AI-provider/on-chain external transfer truth
  - softened future NFT/Pool Points unlock claims
  - changed AI Wallet language to approval-first planning only

### `tests/unit/ai-runtime.test.js`

- Updated runtime tests for session-first key handling.
- Added VM stubs so the ES-module runtime can be unit-tested reliably.
- Updated `persist=true` expectation: it must not write plaintext localStorage keys.

---

## Validation run here

Build/deploy was not run in this chat environment, by user instruction. These code-level checks passed:

| Check | Result |
|---|---|
| `node --check assets/js/chat/ai-runtime.js` | Pass |
| `node --check assets/js/chat-page.js` | Pass |
| `node --check assets/js/workbench-ai.js` | Pass |
| `node --check assets/js/utils/api-key-vault.js` | Pass |
| `node --check assets/js/utils/ai-model-discovery.js` | Pass |
| `node --check assets/js/chat/responses.js` | Pass |
| `node --test tests/unit/ai-runtime.test.js` | Pass — 22/22 |
| `node scripts/site-audit.mjs` | Pass |
| `node scripts/launch-page-invariants.mjs` | Pass |
| `node scripts/launch-readiness.mjs` | Pass, 0 blockers / 0 warnings |

---

## Remaining risks / not solved in Wave 07

### 1. Direct browser API calls still expose keys to the browser environment

BYOK direct-to-provider is acceptable for launch, but users must understand:

- keys are visible to their own browser runtime while in use
- malicious extensions or XSS could still steal active session keys
- users should create restricted provider keys when available
- server-proxy mode is a later premium/business upgrade if EONAPP wants stronger control

### 2. Local AI probing may be affected by browser/CORS/runtime policies

Ollama, LM Studio, and Jan can work locally, but actual detection depends on:

- local server running
- correct port
- CORS settings
- browser mixed-content / localhost behavior

Needs live local test on Windows.

### 3. Provider/model names need periodic refresh

The app has many provider defaults and provider claims. These need a future freshness audit before marketing them aggressively.

### 4. AI Wallet needs a dedicated Wave later

Wave 07 only adjusted language. A full AI Wallet/financial-actions audit should happen in a later financial/wallet wave because it touches:

- transaction proposal UX
- action approvals
- MetaMask handoff safety
- local audit logs
- budget caps
- user confusion risk

---

## CEO product guidance

### Keep

- Guide Mode
- BYOK providers
- local AI positioning
- WorkBench multi-mode cockpit
- free/cheap AI onboarding
- session-first security posture

### Improve before launch

- Add a simple “AI safety & key privacy” microcopy block to onboarding/Vault.
- Test one free provider key live after deploy.
- Test one local runtime on Windows.
- Make sure WorkBench does not overpromise autonomous execution.

### Defer

- Hosted EONAPP AI proxy
- shared/team provider-key vault
- paid hosted inference credits
- AI Wallet automation beyond approval-first planning

---

## Next recommended wave

**Wave 08 — NFT + Collectibles + Market Visual/Product Audit**

Reason: after payments, admin, legal, public UX, Vault, and AI runtime, the next major product pillar is the NFT/collectibles layer. It needs a deep pass on:

- NFT art quality
- rarity system
- metadata truth
- market beta state
- on-chain vs local-only claims
- OpenSea-level presentation goals
- what should ship now vs what should be labeled beta
- whether GPT-5.5 should later improve the generative visuals.

