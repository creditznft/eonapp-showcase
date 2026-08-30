# Final validation receipt — W250–W290 cumulative handover

## Performed locally on the final source tree

| Command | Result |
|---|---|
| `npm run test:unit` | PASS — 279/279 approved current-product tests |
| `npm run lint -- --max-warnings=0` | PASS — zero warnings |
| `npm run build` | PASS — 194 generated production files |
| `npm run qa:current-static-certification:core` | PASS |
| `npm run qa:current-static-certification:tail` | PASS |
| Workspace secret scan | PASS — no potential secrets detected |
| `npm audit --omit=dev` | PASS — 0 known production vulnerabilities |

## Not claimed

No valid Lighthouse score, physical device proof, observed restore proof, Cloudflare/D1 inventory, named-owner operations drill, legal clearance, independent security review, beta approval, or production readiness claim is included. Those work items remain external evidence lanes.

## Archive controls

The adjacent `.integrity.txt` report and `.sha256` file are the archive-level authority. The in-source `SOURCE_SHA256_MANIFEST_W250_W290_FINAL_CODEX54_2026-06-25.txt` records the content hashes. Run `node FINAL_HANDOVER/verify-final-handover.mjs` after extracting before merging.
