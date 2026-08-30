# EONAPP W633 — Every-Route Audit, Alias Retirement and Navigation Cleanup

Date: 2026-07-11  
Parent checkpoint: W632 certified source fingerprint `d37847e9f2108dbd578f071521bc086c5e23678b6a6e586a1d5ae344805f45f6`  
Parent source SHA-256: `ea4e4d0c72bd1a054bb7f59d4655dfeb0a374da21b776f6594e8cea8feab7982`  
Public production certification: **NO-GO**

## Objective

Freeze one reliable route foundation before responsive, accessibility, performance, security, persistence and production-evidence work continues.

## Source work

1. Declare each current public route and retained redirect in the canonical route contract.
2. Require every compatibility redirect to terminate at a live route in one hop.
3. Keep historical HTML aliases only when retained tests still require the source document; never emit those documents in a production build.
4. Remove `.html` and retired-route links from current public pages.
5. Require one correct canonical tag on every emitted public document.
6. Separate each page's real context label from its parent primary-navigation destination.
7. Preserve advanced destinations through the More menu without reintroducing duplicate primary products.
8. Generate both Cloudflare redirect files from the same route contract.
9. Integrate W633 into the maintained unit manifest, current-contract alignment gate and permanent Codex predeploy chain.
10. Keep edge, crawler, service-worker and physical-device observations explicitly pending.

## Defects corrected

- `/onboarding`, `/onboarding.html` and `/start` previously redirected through `/chat`; they now terminate directly at `/`.
- Public About, Privacy, Support and signed-share documents emitted old `.html` links.
- The signed-share page contained duplicate canonical tags.
- Several advanced pages borrowed generic page identities, so mobile/context labels did not identify Forge, Automations, Local AI, Capsule, Settings, Help, Install or Realm Studio correctly.
- The advanced More menu omitted Forge, Automations and Realm Studio.
- The master W623–W640 roadmap still contained a superseded W638/W639 sequence; it now reflects the owner-provided W633–W640 programme.

## Certifying source gates

- `npm run qa:w633-every-route-audit`
- `npm run test:unit`
- `npm run verify:codex-predeploy`

The only deployment preparation sequence remains:

```bash
npm ci
npm run verify:codex-predeploy
```

## Evidence that remains genuine and pending

- deployed Cloudflare edge route probe;
- desktop route/navigation walkthrough;
- Android route/navigation walkthrough;
- iPhone/iPad route/navigation walkthrough;
- service-worker update and route-continuity proof;
- external crawler canonical observation.

Source checks must not be used as substitutes for those observations.
