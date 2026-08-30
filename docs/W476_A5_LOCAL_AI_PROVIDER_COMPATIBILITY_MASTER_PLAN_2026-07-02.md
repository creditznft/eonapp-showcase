# W476-A5 — Local AI Browser Policy & Provider Compatibility Master Plan

**Status:** source implementation complete; local and production-browser evidence remains open.  
**Scope boundary:** no payments, wallets, Dodo, token/NFT/reward mechanics, referrals, checkout, webhooks, secrets, or cloud fallback changes.

## Why this was added

The W476 audit requires one reviewed browser-to-loopback policy, Local AI runtime proof, and protection against stale provider/model contracts. The July 2026 provider review identifies specific compatibility work for DeepSeek, Anthropic, Groq, Together, Gemini, and the OpenAI registry.

This work is a compatibility and truth boundary. It does not claim account access, current provider quotas, enabled APIs, browser CORS success, or production inference.

## Locked behavior after this source wave

### Hosted provider registry

| Provider | Source behavior |
|---|---|
| DeepSeek | Block `deepseek-chat` and `deepseek-reasoner`; require fresh discovery before selecting an available current model. |
| Anthropic | Optional adapter remains disabled unless separately approved; retired/deprecated IDs are blocked before selection. |
| Groq | OpenAI-compatible chat request builder sends `max_completion_tokens`, never `functions` or `function_call`. |
| Together | Reject non-namespaced model IDs before a request can be issued. Audio, image, video, embedding, TTS and Whisper-like IDs remain excluded from the text-chat picker. |
| Gemini | Continue Models/ListModels discovery and require `supportedGenerationMethods` to include `generateContent`. |
| OpenAI | Text chat remains discovery-led. No image-model adapter is active. The listed image IDs are a future registry-review item, not an enabled feature. |
| Cerebras, Fireworks, Mistral, OpenRouter, NVIDIA NIM, SambaNova | No endpoint or auth migration is claimed in this wave; all remain model-discovery and account-verification gated. |

### Local AI text runtime policy

- Supported browser-facing text runtimes: **Ollama**, **LM Studio**, and **Jan**.
- Discovery is only after a user action. EONAPP never starts a runtime, downloads a model, scans a LAN, or probes in the background.
- Only known loopback hosts/ports are accepted: Ollama `11434`, LM Studio `1234`, Jan `1337` or `6767`.
- A scanned model must pass a runtime-local self-test before it may be selected for EONBOT.
- A failed local selection does not create a silent cloud fallback. A different provider requires a new explicit user choice.
- Source-level CSP is generated from the same contract and applies only to the EONBOT/Local AI routes.

### Local image and video truth

Local image/video model **selection and execution are not implemented in W476-A5**. Existing Creator media material is guidance only. The product must not present a local media model as selectable or functioning until a dedicated browser adapter proves: user approval, narrow loopback policy, runtime capability discovery, model selection, one generation, output storage handling, cancellation/error states, CSP/CORS behavior, and no cloud fallback.

## Evidence required before W476-A5 can be certified

1. On production `https://eonapp.ch`, test Ollama, LM Studio, and Jan in a real browser:
   - route opens;
   - user taps scan;
   - discovery request succeeds;
   - model list reads;
   - a selected model self-tests;
   - one local EONBOT response succeeds;
   - console/CSP/CORS/network output is captured and redacted.
2. Record a truthful failure result for every runtime where the server needs an end-user CORS or local-network setting. Do not claim it works without that proof.
3. Test blocked LAN and wrong-port endpoints; confirm they cannot be entered into the Local AI flow.
4. Run a provider verification with synthetic/no-secret controlled account access only where a provider owner elects to do so. No model-list check equals an entitlement, pricing, or quota claim.

## Remaining programme

| Wave | Purpose | State |
|---|---|---|
| W476-A5.1 | Provider compatibility policy, request builder, current model filters | Source complete |
| W476-A5.2 | Local text runtime contract, Jan UI, route-specific CSP generator | Source complete |
| W476-B | Production browser proof, GA proof, update/rollback survival, API matrix | Open |
| W477 | Canonical route, sitemap, legacy commercial retirement, search cleanup | Open |
| W478 | Accessibility, optional OAuth lifecycle, real-device matrix | Open |
| W479 | City playable vertical slice and Realm usefulness proof | Open |
| W479-M | **Future local creator media programme** — device-first image/video capability contracts, lightweight image-to-video through advanced local video, and browser/device proof; not a W476 feature. See `docs/W479M_LOCAL_CREATOR_MEDIA_PROGRAMME.md`. | Planned; no adapter connected |
| W479.5 | Final non-payment certification | Open |
| W480 | Dodo only after all non-payment gates actually pass | Blocked |

## W479-M creator-media programme

The future Local Creator Media programme is intentionally substantial: it begins with a non-technical “Choose your device” journey and supports capability levels from light image-to-video through advanced local video workflows on strong creator machines. It is governed by the separate plan in `docs/W479M_LOCAL_CREATOR_MEDIA_PROGRAMME.md`.

No media runtime is selectable until its own adapter proves explicit local connection, capability discovery, model/workflow selection, one local generation, cancellation/errors, output handling, CSP/CORS/PNA behavior, and no silent cloud fallback.

## W479-M entry conditions for local image/video model support

- W476-B browser/local-text proof is complete first.
- Each media runtime gets its own reviewed adapter and loopback allowlist; no arbitrary ComfyUI/LAN URL box.
- The UI distinguishes text, image, video, model discovery, compatible capability, executable workflow, and output persistence. It may not infer capability from a model name.
- Physical-device/browser proof includes memory/error handling and output cleanup.
- Any runtime that routes a model remotely must be visibly excluded from Local mode unless the user separately chooses a connected provider.
