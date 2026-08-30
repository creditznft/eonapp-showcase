# W289 / W290 — controlled beta and final recertification board

**State:** `EXTERNAL_EVIDENCE_REQUIRED_BETA_BLOCKED`  
**W260:** remains `NO-GO`.

## W289 — beta cannot begin until all are independently closed

- W301 owner-approved reachable Git-history secret remediation and green CI rerun.
- W358 live AI provider proof using the operator's local `.env.local`, including at least one end-to-end browser-backed Chat proof and recorded non-secret receipts.
- W282 valid desktop and mobile Lighthouse/Web Vitals artifacts.
- W259/W266 real device visual, keyboard, touch, reduced-motion, accessibility, and performance review.
- W276 observed update/restore proof using a disposable profile.
- W283 owner-run Pages/D1 read-only evidence and a documented Preview rollback plan.
- W268 named owners and observed drills.
- W278 qualified legal/compliance review for actual intended features.
- W279 independent security review with remediation/retest.
- W258 chain evidence if W261/W262 are still requested.
- W284 formal referral activation decision if referral/milestone is still requested.
- W359-W365 downstream lanes only after the above remain truthful: real device/offline/backup proof, merchant/payment readiness, controlled beta review, evidence recovery, and final release sign-off.

## W290 — final recertification evidence packet

Only after W289 beta outcomes are reviewed, produce a redacted package containing:

1. Exact source hash/commit and dependency lockfile hash.
2. Verified test/lint/build/release-gate receipts.
3. Valid Lighthouse/device/restore evidence with raw artifacts retained separately.
4. Cloudflare/D1 read-only inventory and Preview rollback plan.
5. Named owner/drill record.
6. Legal and independent-security reviewer records.
7. Open issues, accepted risks, rollback owner, and explicit GO/NO-GO decision.

No source gate, planning document, or package archive can be used as a substitute for those external records.

## W301-W358 carry-forward truth

- W301-W358 source work can be merged and validated locally without claiming Preview or production.
- Current local live-AI state is mixed but real: Groq direct probe passed, Groq localhost browser proof passed, Gemini direct probe passed, OpenRouter is billing-blocked, and Ollama is not reachable on the current machine.
- None of those local proofs remove the W301 history blocker or replace Cloudflare/device/rollback evidence.
