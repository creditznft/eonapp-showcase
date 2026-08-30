# RT97 Vexrail India live Chrome proof

Run this **after protected Production deployment** from a real Indian internet connection with VPN/proxy disabled. Codex may use its Chrome/browser integration to capture the evidence.

## 1. Public geo proof — no sign-in required
Open `https://eonapp.ch/api/ai/vexrail` in Chrome or execute same-origin fetch from eonapp.ch DevTools.

Required evidence:
```json
{
  "configured": true,
  "rollout": "production",
  "geoMode": "selected_countries",
  "country": "IN",
  "geoEligible": true,
  "geoReason": "selected_country",
  "dynamicModelRouting": true,
  "modelSelection": "server_dynamic",
  "routingMode": "verified_cheapest_qualified",
  "economicsVerified": true
}
```
The response must not contain Vexrail secret/publishable credentials or a fixed selected model.

If `country` is not `IN`, do **not** change code/geo mode to hide the issue. Confirm the test is really on an Indian connection and Cloudflare request metadata is present.

## 2. Signed-in readiness proof
With a normal signed-in EONAPP session, request:
`GET https://eonapp.ch/api/ai/vexrail-readiness`

Required:
- HTTP 200 if dynamic economics/model coverage is healthy
- `observedCountry: "IN"`
- `geoEligible: true`
- `geoReason: "selected_country"`
- `geoMode: "selected_countries"`
- `dynamicCoverageReady: true`
- `dynamicRoutingAvailable: true`
- `secretsExposed: false`

The endpoint is intentionally signed-in and rate-limited.

## 3. Real sponsored-AI UI proof
Test both desktop Chrome and Android Chrome if available:
1. Load the main EONBOT experience fresh.
2. Confirm a guest can only receive the bounded one-shot sponsored path when eligible; Turnstile/human verification must be honored.
3. For a Free signed-in account, send ordinary safe prompts through Sponsored Vexrail and confirm responses render normally.
4. Confirm paid accounts remain ordinary-ad-free and Sponsored Vexrail requires explicit opt-in.
5. Confirm Local AI and BYOK never silently route to Vexrail.
6. Use a harmless prompt containing an obvious fake secret-like token/email/government-ID pattern and prove the sensitive-data guard rejects it instead of forwarding it.
7. Inspect Network/console: no Vexrail credentials in browser responses/logs; no fixed model selection from client state.
8. Record request success/failure, sponsored-result presence/no-result behavior, latency and model economics only through the server-authoritative telemetry paths.

## 4. What “ads are showing” means for Vexrail
Vexrail sponsored content is not a banner inventory check. Verify the sponsored AI route is eligible in India and that sponsored recommendation/result labeling appears when the upstream response actually contains sponsored content. **Do not force, fabricate or click sponsored content merely to produce evidence.** A legitimate no-sponsored-result response is valid telemetry and must not be converted into a fake ad.

## 5. Stop conditions
Stop release/traffic scaling if any of these occur:
- Cloudflare observes a non-IN country on a real Indian connection without a known network reason
- geo policy is `all` or metadata requirement is disabled
- keys/secrets appear client-side
- Local AI/BYOK silently falls back to Vexrail
- a paid user gets ordinary display ads without explicit sponsored-provider choice
- browser client events can forge revenue/cost
- sensitive/private content is forwarded to sponsored discovery/Vexrail contrary to the contract
