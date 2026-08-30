# W353–W357 — local beta, release governance, and provider lifecycle hardening

**Status:** Source implementation complete; external launch/payment/device gates remain fail-closed.  
**Architecture:** Local-first. No Google Login, Cloudflare workspace control plane, card/UPI checkout, token, wallet, NFT sale, referral programme, account connection, background agent, or unattended execution was added.

## What is implemented

### W353–W354: Local Beta Readiness Desk

Workspace now combines the Device Proof Kit with four explicitly user-confirmed, non-sensitive declarations:

- encrypted backup/restore drill completed;
- local-first privacy review completed;
- an invite-only beta issue owner/response plan exists, without storing a name or contact;
- invite-only/no-telemetry/no-commerce policy acknowledged.

Only four booleans are stored locally. The desk cannot send invitations, enroll a tester, collect a feedback payload, inspect a device, upload screenshots, collect telemetry, create a provider request, enable billing, or approve a beta.

### W355: Referral commercial re-entry firewall

Realm Share Relics remain free local cosmetics. The firewall keeps all referral activation disabled even if hypothetical billing/refund/abuse/support prerequisites are supplied. Cash, crypto, points, token, wallet, payout, attribution tracking, discount issuance, and automatic activation remain impossible in this wave.

### W356: Fail-closed Release Board

Workspace now shows the distinction between local preparation and release authority. It always retains these external blockers:

1. recovery and verification of canonical release-evidence boards from authoritative Git history;
2. owner-approved Git-history secret remediation and post-rewrite verification;
3. real-device proof and independent release/security/accessibility/legal review.

It cannot certify, deploy, enroll beta users, or approve a release.

### W357: Provider lifecycle and protocol governance

The provider review board and adapter registry now share canonical transport-family names. Legacy review aliases normalize locally at review/import time:

| Input alias | Canonical adapter protocol |
| --- | --- |
| `anthropic-messages` | `anthropic-native` |
| `gemini-generate-content` | `gemini-native` |
| `local-web-runtime` | `local-openai-compatible` |
| `openai-chat-completions` | `openai-compatible-chat` |

This is a protocol contract, not a model list. No provider endpoint, key, model enumeration, discovery network call, or automatic activation is added.

Model manifests are now time-bound evidence:

- Direct-to-provider records require user refresh after 7 days.
- Device-local records require user refresh after 30 days.
- A stale manifest blocks policy routing with `model-manifest-user-refresh-required`.
- The system does not fetch, silently replace, cross-route, or auto-select a substitute model.

## Validation performed

- `npm run qa:w356-w352-regression` — pass.
- `npm run qa:w357-provider-lifecycle-governance` — pass.
- `npm run qa:w310-w315-ai-kernel-foundation` — pass after lifecycle integration.
- `npm run lint -- --max-warnings=0` — pass.
- `node scripts/secret-scan.mjs --mode=workspace --allow-no-history` — pass.
- `npm run build` — pass; 199 distribution files at this point in the session.

## Known external and inherited blockers

- Merchant onboarding and test credentials have not been supplied. Therefore there is no checkout, processor, billing verifier, webhook, price, subscription, licence, refund workflow, or referral discount.
- Real device/browser/private-mode/offline/backup proof requires actual devices and cannot be created by source code.
- The supplied baseline lacks canonical release-evidence boards and includes archived-source hash mismatches. These remain external release blockers; no evidence was recreated or altered.

## Next safe sequence

1. Recover canonical release-evidence boards and complete the owner-approved W301 history remediation in the authoritative repository.
2. Run real-device evidence using the Device Proof Kit on desktop, 4 GB Android, offline, private browsing, storage failure, backup/restore, and direct-BYOK error paths.
3. Deploy the truthful static site and complete Razorpay/Cashfree/Dodo merchant due diligence externally.
4. After written processor approval and test credentials, start a separately reviewed test-mode checkout prototype with hosted checkout only and a narrow billing verifier. Do not reuse `platform-backend`, referral, wallet, EONLite, Polygon, NFT-sale, or reward code.
5. Keep Local Relics and Relic Passport cosmetic/local-only during beta.
