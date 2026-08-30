# W611 — Current Test Baseline Reconciliation

**Date:** 4 July 2026  
**Purpose:** reconcile the full current unit suite with the actual W602–W606 source state, without deleting security or truth checks to inflate a pass count.

## Result

- Baseline before W611: **718/739 passed; 21 failed**.
- Result after W611: **739/739 passed**.
- Lint: passed with zero warnings.
- Production build: passed.

## Reconciled groups

| Group | Prior mismatch | W611 outcome |
|---|---|---|
| W365 / W406B / W407–W409 | Expected zero City binaries even though W602–W604 created local catalogued GLB engineering candidates. | Replaced with tests that require same-origin paths, hashes, provenance, procedural fallbacks, no remote network, and final-visual approval remaining false. |
| W417 / W418 | Treated any binary candidate as final-art readiness or as impossible. | Reframed candidates as loadable engineering assets only; manifest/review/device/owner gates remain required for final visual release. |
| W524 | Required newer historical handovers to route through an older historical W524 file. | Updated the gateway to accept the single current entrypoint while preserving historical-only markers. |
| W566 / W567 | Required candidate/provenance registries to report binary loading disabled despite W602–W604 source-local candidate assets. | Preserved empty future intake/package queues, but distinguish current candidates from final package/release claims. |
| W452 / W520 / W534 / W535 | Stale `/chat` emissions, size-guard drift, historical index drift and preview-state wording. | Repaired actual source/documentation defects and retained limited-preview truth. |

## Boundaries retained

1. Candidate GLBs are same-origin only and retain procedural fallbacks.
2. Candidate presence does **not** equal KTX2/Basis packaging, licence clearance, final visual certification, authenticated production approval, device proof, or owner approval.
3. No remote art loader, Cloudflare proxy, user data path, hidden action, or auto-navigation was introduced.
4. The W599/W600A authenticated browser closeout remains the primary release blocker.

## Next order

1. **W600A:** authenticated production Start Here / pointer / recovery proof.
2. **W607 City:** end-to-end direct-click, movement, camera, keyboard/controller/touch and return-loop proof.
3. **W607 AI:** explicit owner-authorized real local/direct text and code output evaluation.
4. **W608–W610:** Creator local media adapter, authorized edit pipeline, and local quality dashboard only after real output proof.
5. **W145 / commercial / trust / mobile / final release tracks:** continue as listed in the master launch ledger.
