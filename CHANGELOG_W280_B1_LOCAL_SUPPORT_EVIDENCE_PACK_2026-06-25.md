# Changelog — W280-B1 Local Support Evidence Pack

**Date:** 2026-06-25  
**Scope:** source-safe support and evidence usability hardening on top of W280-A0.

## CEO decision

EONAPP support remains self-service first. A user may create a small, inspectable, **local** evidence file, but EONAPP does not silently file, store, transmit, route, triage, or promise human handling of it.

## Implemented

- Added a local support evidence pack to `/support`.
- Packs include only a canonical topic, same-app pathname without query/fragment, coarse device/browser classes, timestamp, and redacted expected/actual text.
- Common secret-like values, full URLs, long token-like strings, card-like number sequences, wallet-like `0x` strings, and key/value credential patterns are redacted before preview.
- The user sees the JSON preview first. Manual copy/download becomes available only after explicit review acknowledgement.
- Added `assets/js/utils/support-evidence-pack.js` as a pure side-effect-free builder.
- Added W280-B1 source contract, fail-closed gate, unit tests, and current-suite registration.

## Boundaries preserved

The feature has no:

- network request, beacon, socket, event stream, support ticket, email, form submission, background upload, or third-party integration;
- local/session/IndexedDB persistence for evidence text;
- raw user-agent export, query/fragment export, full URL export, secret retention, personal-data claim, security-disclosure channel, SLA, or human-response promise;
- payment, wallet, chain, reward, referral, or commercial behavior.

Automatic redaction is a guardrail, not a substitute for a person's review before manual sharing.

## Verification

- `npm run test:unit` — **279/279** approved current-product tests passed.
- `npm run lint -- --max-warnings=0` — passed with zero warnings.
- `npm run build` — passed with 194 generated distribution files.
- W280-A0 and W280-B1 gates, W145, W260, W283/W284, W286-B3, workspace secret scan, and production dependency audit passed.
- `npm audit --omit=dev` — 0 known production vulnerabilities.

## Still not proven

This is not staffed support, security disclosure handling, human incident response, accessibility/device proof, legal review, independent security review, Cloudflare evidence, beta evidence, deployment, or launch approval. W260 remains **NO-GO**.
