# W606 Current Unit Suite Reconciliation Log

**Run:** 4 July 2026, W606 source state  
**Command:** `npm run test:unit`  
**Result:** 718 passed / 739 total / 21 failed.

## Truthful classification

The focused AI/client-only research gates, lint, W605 suite, W606 suite, production build and smoke check pass. The 21 broad-suite failures do **not** point to the W606 AI changes. They are historical-source assertions that conflict with W602–W604 City asset work or stale handover/document expectations. They must be reconciled in **W611** before any “full unit suite green” claim.

| Group | Failed tests | Why it is red now | W611 required action |
|---|---:|---|---|
| W365 old City asset foundation | 3 | Asserts zero shipped/loadable assets; W602/W604 added original local GLB candidate assets. | Rewrite for current asset provenance/LOD/runtime contract or archive as historical. |
| W406B / W407 / W408 / W409 old art intake gates | 6 | Requires EONBOT and related authored art to remain planned/non-loadable. | Replace with W602–W604 current-art provenance/quality gates; preserve old test only as archaeology. |
| W417 / W418 old final-art boundary | 3 | Asserts no City binary art is approved or loaded. | Move to historical suite; add current evidence boundary that still blocks visual-release approval. |
| W452 / W520 / W524 | 4 | Older route/handover/orchestrator assertions no longer match the present source layout. | Re-audit each independently; do not assume it is safe to exclude. |
| W534 / W535 | 3 | Historical index/P2P quarantine/release-board expectation drift. | Regenerate/repair index and release-truth test only after current evidence board review. |
| W566 old City source register | 2 | Requires binary art intake to remain empty; W602/W604 changed that premise. | Replace with asset catalog/provenance/hash tests and retain historical test outside current certification. |

## Guardrail

No test may be removed from current certification merely to make a count green. W611 must give every item a reason, an owner, a replacement test where applicable, and a result recorded in the next master ledger.
