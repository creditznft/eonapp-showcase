# RT97 Production browser and device test matrix

Run after the protected workflow proves identical Preview/Production bytes.

## A. Release authority / infrastructure
- `https://eonapp.ch/release/candidate-provenance.json` commit + candidate digest match the protected workflow receipt.
- `/ads.txt` returns the exact Google publisher line.
- `/api/billing/status` is Production/live and all expected products are configured.
- `/api/monetization/status` shows ordinary display OFF, reward provider configured, bounded reward class and permanent value false.
- `/api/ai/vexrail` shows production/dynamic/verified economics and, from India, `country=IN`, `geoEligible=true`.
- Signed-in `/api/ai/vexrail-readiness` shows India + complete model coverage.

## B. AdSense/public guide acquisition
Desktop Chrome + mobile Chrome:
- guide index and all featured utilities load, have correct canonical/title/structured content and no duplicate metadata
- AdSense ownership/bootstrap requests appear only on intended guide/editorial pages
- no manual/placeholder ad slot IDs
- interactive calculator/hardware/comparison tools remain fully usable
- EONBOT CTA remains review-first and not obscured by ads
- after Google is actually serving ads: verify excluded areas/page exclusions and no unacceptable layout shift
- root/chat, Local AI, City, work/account pages do not load ordinary ad units

## C. EONBOT / Vexrail / privacy
- guest one-shot bounded path
- Free signed-in sponsored path
- paid explicit sponsored opt-in only
- Local AI and BYOK private/ad-free path
- sensitive-data rejection
- no secret/key/model pin client leakage
- network/bot/Turnstile/rate-limit fail-closed behavior

## D. Rewarded Sponsor Video
Signed-in account only:
- Sponsor Video is voluntary; ordinary display remains off
- player start/fill can be observed without creating a reward by itself
- completion requires server-side validated VAST sequence/session authority
- duplicate/replayed/expired completion fails
- reward class is `bounded-sponsor-unlock`; `permanentValueAllowed=false`
- browser event cannot set realized provider revenue
- test caps/cooldown/idempotency and refresh/replay

## E. Sponsored Discovery on Local AI page
- appears as a separate explicit tool, not automatic prompt injection
- signed-in only; it never consumes the guest one-shot
- requires review then explicit confirmation; this confirmation is the paid-user sponsored opt-in for this one request only
- sends only bounded query/category/result-count intent fields as a new one-turn Vexrail request
- full Local/BYOK history, the Local/BYOK answer, memory, provider keys, files and attachments are never forwarded
- real Turnstile, selected-country policy, verified-cheapest model routing, rate limits and profitability governor are reused from the existing Vexrail authority
- contextual promoted recommendations may appear naturally in the Vexrail completion; no separate ad payload is fabricated
- Local AI/BYOK model execution itself remains private/ad-free and does not require Sponsored Discovery

## F. EON City physical-device acceptance
At least one weak Android + one desktop:
- portrait with browser chrome visible is usable
- landscape full-screen path remains usable
- target weak-device 25–30 FPS acceptance is measured, not assumed
- camera clipping, collision/unstuck, thumb sensitivity and modal/input release feel correct
- app switch, screen lock, tab background, orientation change and WebGL context loss recover safely
- long-session JS heap/GPU/resource trend does not grow unbounded
- Return/Home/City menu/modal travel loops converge without stuck movement

## G. Local Lite physical acceptance
- supported-device capability evidence is truthful
- Auto stays conservative until local Balanced proof exists
- background/pagehide releases worker resources
- model cache removal is explicit and restricted to approved model entries
- malformed cache entries do not break deletion of later valid approved entries
- no silent cloud fallback

## H. Economics / traffic scale decision
Do not scale PPC traffic merely because technical checks pass. Import provider/accounting evidence and require:
- PPCmate spend reconciled
- AdSense/ExoClick/VAST realized revenue reconciled from provider evidence
- Vexrail revenue/cost reconciled
- contribution per visitor / break-even CPC and CPM measurable
- D7/D30 cohort evidence before claiming LTV

If contribution is negative/unknown, leave traffic at bounded learning levels.
