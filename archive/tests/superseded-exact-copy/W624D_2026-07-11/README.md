# W624D Superseded Exact-Copy Test Archive

**NON-CERTIFYING ARCHIVE — NOT A RELEASE GATE**

This directory preserves archived copies of test files that contained exact historical assertions superseded by later canonical EONAPP contracts. The archived content is preserved semantically and its line endings are normalized to LF for portable Git storage; it is not byte-for-byte identical to the original Windows checkout.

The original assertions are not deleted or rewritten. Their current `tests/unit/` counterparts contain explicit `test.skip` markers, one reason, and named maintained replacement coverage recorded in `MANIFEST.json` and `config/w624d-current-contract-alignment-contract.mjs`.

Use these copies only for archaeology, migration review, or understanding old product decisions. Do not run this archive to approve a deployment. Current certification uses:

```bash
npm run test:unit
npm run verify:codex-predeploy
```

The archive contains no source-of-truth instruction for current routes, commercial status, City architecture, accessibility proof, browser/device proof, or launch readiness.

