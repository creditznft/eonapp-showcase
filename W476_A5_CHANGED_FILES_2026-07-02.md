# W476-A5 Changed Files — Local AI & Provider Compatibility

## Added

- `config/local-ai-browser-contract.mjs` — canonical loopback runtime/route/CSP contract for Ollama, LM Studio, and Jan.
- `scripts/sync-local-ai-csp.mjs` — deterministic generator for root/public Local AI CSP overrides.
- `scripts/write-r3a1-ai-api-contract-board.mjs` — deterministic writer for the static provider-contract evidence board required by the older current-contract gate.
- `scripts/w476-local-ai-provider-compatibility-gate.mjs` — source-contract gate for provider/model compatibility, CSP and UI wiring.
- `tests/unit/w476-ai-api-and-local-browser-contract.test.mjs` — regression tests for retired IDs, Together namespace rules, loopback ports, CSP generation and Local AI truth.
- `docs/W476_A5_LOCAL_AI_PROVIDER_COMPATIBILITY_MASTER_PLAN_2026-07-02.md` — merged API-review and Local AI plan.

## Updated

- `config/ai-api-contracts.mjs` — W476 compatibility policy for DeepSeek, Anthropic, Together, Groq and inactive OpenAI image registry review.
- `assets/js/chat/ai-runtime.js` — compatibility filtering, cached verification rejection, strict local endpoints, contract-derived runtime discovery and Groq output field.
- `assets/js/local-ai/local-runtime-status.js` — strict approved runtime/port verification and correct Jan fallback.
- `assets/js/local-ai/local-ai-page.js` — Jan runtime card plus explicit text-vs-media status.
- `_headers` and `public/_headers` — generated narrow Local AI CSP route overrides.
- `chat.html` — removed conflicting meta CSP so route headers are the single Local AI CSP source.
- `scripts/build-production.mjs` — refreshes the provider-contract board and CSP generator before production build.
- `scripts/w476-release-verify.mjs` — includes the W476-A5 source gate/tests/syntax checks.
- `scripts/run-current-unit-suite.mjs` — includes the new W476-A5 unit suite.

## Explicitly not changed

No payment, Dodo, subscription, checkout, wallet, token, NFT, reward, referral payout, API secret, provider key, Cloudflare secret, OAuth credential, or deployed production configuration was changed.
