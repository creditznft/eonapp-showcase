# W525B–W535 — CEO Product and Release-Truth Audit

## Executive decision

EONAPP now has a coherent local-first continuity and account model. The product should remain in **limited-preview evidence preparation**, not present itself as a live cloud-sync or Web3-resilient service.

The next external action is **W526 review-branch CI reconciliation**. It is intentionally narrower than deployment.

## Decisions locked

| Topic | Decision |
|---|---|
| Daily app origin | `eonapp.ch` only |
| Current data continuity | One manual, encrypted, user-held Portable Workspace Capsule with every eligible local record together |
| Compression | Not implemented; do not claim compression |
| Automatic multi-device sync | Not active |
| Google Login | Identity-only |
| Google Drive | First future encrypted snapshot connector, separately consented, disabled/not connected now |
| OneDrive | Second future connector, after Drive evidence |
| IPFS/Pinata | Future encrypted mirror design only; not a sync engine and not active product storage |
| Vault Reveals | Visual-only collection, no financial/ownership/reward effect |
| EON.HUB | Separate static Trust & Rescue layer; never app/OAuth/PWA/payment/user-storage origin |
| Release state | `LIMITED_PREVIEW_ONLY` pending real CI/preview/device/OAuth/owner evidence |

## What users see

The Account/Profile/Settings/Vault experience is intentionally organized like a calm preferences product rather than a technical admin console:

- Account information and preferences are grouped rather than duplicated.
- Recovery is the first Vault concern.
- Backup uses human language and states whether a path is manual, planned or connected.
- AI provider keys are isolated in an advanced space rather than mixed with recovery.
- Visual Reveals cannot be mistaken for an asset wallet, reward balance or marketplace.
- Desktop hover can reveal the account popover after a short delay; touch, click and keyboard remain explicit.

## What this source does not prove

This audit does **not** prove Git history, a push, GitHub CI, a preview, Cloudflare deployment, physical PWA installation, actual Android/iPhone/tablet behavior, Google OAuth completion, Google Drive consent/upload/restore, provider token security in production, a published CID, an Unstoppable domain transaction, payment, rewards, referral activity, social posting, or launch approval.

## Audit outcomes

1. Product claims are aligned with current behavior: local-first manual encrypted Capsule, not cloud sync.
2. Google Drive is clearly differentiated from account sign-in and is not silently enabled.
3. EON.HUB is isolated from active EONAPP runtime surfaces and its signed shares retain local fragment verification/manual continuation only.
4. Historical P2P/referral-era material is quarantined and marked non-current.
5. Safe evidence code exists for future local AI, browser/PWA, emulator and structural OAuth work, without invoking sensitive actions by default.

## Required evidence before a broader launch decision

- Review-branch CI evidence and, if approved, preview evidence.
- Physical Android, iPhone and tablet Capsule/PWA/update checks.
- User-controlled Google sign-in evidence.
- A separately approved Google Drive permission, upload, restore, revocation and conflict proof lane.
- EON.HUB test publication/CID/gateway verification and owner wallet transaction record.
- Owner GO / limited-preview / NO-GO decision based on that evidence.
