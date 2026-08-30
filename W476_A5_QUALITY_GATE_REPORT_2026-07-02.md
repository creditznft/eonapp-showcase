# W476-A5 Quality Gate Report — 2026-07-02

## Result

**SOURCE GATES PASS.** This package is a source/configuration handover, not production, device, provider-account, or browser-runtime certification.

## Passed commands

| Command | Result |
|---|---|
| `npm run lint` | PASS |
| `npm run qa:r3a1-ai-api-contracts` | PASS — 15 static hosted-provider contracts; no provider network calls |
| `npm run release:verify` | PASS — storage, portable-state, service-worker, Local AI/provider compatibility, provider-contract board, analytics and syntax gates |
| `npm run test:unit` | PASS — 527 passed, 0 failed |
| `npm run build` | PASS — 286 dist files; generated Local AI CSP and provider-contract board |
| `npm run smoke:build` | PASS — 21 required build files present |

## W476-A5 closure evidence in source

- DeepSeek legacy model IDs are rejected before selection.
- Retired/deprecated Claude IDs are rejected before optional adapter enablement.
- Together requires namespaced IDs and text chat filters exclude audio/image/video/etc. IDs.
- Groq-compatible builder uses `max_completion_tokens` and does not emit `functions` or `function_call`.
- Gemini capability filtering remains `supportedGenerationMethods.includes('generateContent')`.
- Ollama, LM Studio and Jan are defined from one Local AI browser contract.
- Only documented loopback ports are accepted. Public, LAN/RFC1918 and arbitrary loopback endpoints are rejected.
- Root/chat/local-AI CSP exceptions are generated from the same contract and do not contain `upgrade-insecure-requests`.
- Local image/video generation remains explicitly not connected.

## Not run / not claimed

| Evidence | Status |
|---|---|
| Production `https://eonapp.ch` browser discovery/self-test/EONBOT flow for Ollama | NOT RUN |
| Production browser discovery/self-test/EONBOT flow for LM Studio | NOT RUN |
| Production browser discovery/self-test/EONBOT flow for Jan | NOT RUN |
| Local runtime CORS/PNA evidence | NOT RUN |
| Real provider-account model-list verification | NOT RUN |
| GA DebugView/redacted live-network evidence | NOT RUN |
| Production service-worker update/rollback storage survival | NOT RUN |
| Physical device matrix | NOT RUN |
| Local image/video runtime adapter proof | NOT IMPLEMENTED |

## Scope protection

No payment/Dodo, checkout, billing, wallet, token/NFT, reward, referral payout, secret, OAuth credential, Cloudflare secret, provider key, or production deployment change is included.
