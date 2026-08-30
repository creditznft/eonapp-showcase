# EONAPP W617B — Codex Handoff Certification Pack

Date: 2026-07-10
Mode: local/Codex handoff; generated without deploy, checkout, webhook, trial, referral grant or EON Key redemption.

## Current decision
- Dry decision without local proof: **no-go**
- Launch stage: **code-complete-local-candidate-not-deployed**
- This is expected: source QA, browser/mobile QA, Cloudflare deploy proof and Dodo/server proof must happen locally/outside this chat before production activation.

## Exact Codex/local command order
1. `npm ci`
2. `npm run qa:w616b-eon-keys-referral`
3. `npm run qa:w616c-locked-feature-resolver`
4. `npm run qa:w616d-locked-feature-surfaces`
5. `npm run qa:w617a-shell-launch-readiness`
6. `npm run qa:w617b-launch-master-plan`
7. `npm run lint -- --max-warnings=0`
8. `npm run build`
9. `npm run smoke:build`
10. `npm run launch:readiness`
11. `npm run launch:page-gate`
12. `npm run launch:identity-gate`
13. `npm run launch:quality-gate`
14. `npm run security:secret-scan`
15. `npm run test:unit`
16. `npm run test:e2e:current`

## Proof artifacts to collect
- local npm install log
- focused W616/W617 QA log
- lint log
- build log and distribution hash
- smoke build log
- secret scan result
- browser QA screenshots for home, Projects, Workspace, Local AI, Automations, Vault, EON Keys and EON City
- mobile Chrome QA notes and screenshots
- Cloudflare Pages deployment id and custom-domain HTTPS proof
- headers, redirects and service-worker cache proof
- Dodo product/webhook/entitlement proof or explicit paid-disabled note
- referral/EON Key server-ledger proof or explicit grants-disabled note
- CEO final go / soft-launch / no-go note

## Required final passes
- npm ci, focused W616/W617 QA, lint, build, smoke build and secret scan
- All primary app routes load: home, Projects, Library, Workspace, Local AI, Automations, Vault, EON Keys and EON City
- Sidebar/menu/drawer accessibility and mobile navigation proof
- Locked-feature cards show Subscribe, Trial, Refer for EON Keys and Use EON Key without activating checkout or redemption
- EON City guest/auth gate proof, authenticated Babylon renderer proof and mobile landscape proof
- Local AI and own-provider/API-key copy proof; no platform-paid AI credit claims
- Dodo checkout/webhook/entitlement proof if paid activation is enabled, otherwise paid CTAs remain disabled
- Referral/EON Key server-ledger proof if live grants are enabled, otherwise grants remain disabled
- Cloudflare Pages deploy proof with build hash, custom domain HTTPS, headers, redirects, cache and rollback proof
- Privacy, terms, billing and support copy review
- Accessibility smoke pass and mobile/browser visual proof
- CEO go / soft-launch / no-go note with paid activation explicitly on or off

## Accepted soft-launch limits
- Dodo checkout, public trials and EON Key redemption can remain disabled during soft launch.
- Referral rewards are non-transferable EON Keys/capability/cosmetics only until server ledger proof exists.
- EONAPP does not sell platform-paid AI/image/video credits at launch; users use local AI or their own provider/API keys.
- EON City may remain beta/preview until authenticated renderer, controls and mobile proof are recorded.
- No browser-only entitlement unlock is acceptable for paid/server-side features.
- Creator commerce and marketplace purchase flows stay disabled unless separately reviewed and proven.

## CEO hard stops
- No broad launch without local build/smoke proof.
- No paid activation without Dodo checkout, signed webhook and server entitlement-ledger proof.
- No referral/EON Key grants without server referral ledger, idempotency and abuse-cap proof.
- No creator-commerce, wallet checkout or seller marketplace activation in this launch path.
- No profit/resale/passive-income claims.

## Final handoff instruction
Use this workspace as a source-validated candidate only. Do not broadly launch and do not enable Dodo checkout, trials, live referral grants or EON Key redemption until W617C/W617D server proof and Cloudflare deployment proof are recorded.

